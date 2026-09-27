/**
 * Katalogların "Complete Brake Caliper" bölümündeki MNV-A-xxxx komple
 * kaliperlerini ekler (Temmuz import'u harf ekli bu kodları hiç tanımamıştı).
 *
 * Veri: complete-calipers.json — 5 marka PDF'inden koordinat tabanlı
 * ayrıştırmayla üretildi (tip, OEM + üretici sütunu, taşıyıcı, tamir setleri,
 * sayfadaki 3 fotoğraf).
 *
 * Güvenlik:
 *  - Var olan SKU'yu ATLAR (yeniden çalıştırmak güvenli).
 *  - R2'de aynı boyutta dosya varsa yeniden yüklemez.
 *  - Yalnız yeni satır ekler; mevcut ürünlere dokunmaz.
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env --env-file=.env.local \
 *     prisma/import/import-complete-calipers.ts --img-dir=/path/to/jpgs --dry-run
 *   (--skip-r2: görseller zaten yüklüyse yalnız DB)
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { normalizeOem } from "../../src/lib/products/normalize-oem";

const DRY = process.argv.includes("--dry-run");
const SKIP_R2 = process.argv.includes("--skip-r2");
const IMG_DIR = process.argv.find((a) => a.startsWith("--img-dir="))?.slice(10);
const R2_PREFIX = "products/kaliper/";

type Row = {
  sku: string;
  category: string;
  pdf: string;
  page: number;
  nameTr: string;
  nameEn: string;
  type: string;
  carrier: string | null;
  repairSets: string[];
  oem: { number: string; manufacturer: string | null }[];
  images: string[];
};

const rows: Row[] = JSON.parse(readFileSync(join(__dirname, "complete-calipers.json"), "utf8"));
const prisma = new PrismaClient({ datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

function descriptions(r: Row) {
  const trParts = [`Komple fren kaliperi — ${r.type}.`];
  const enParts = [`Complete brake caliper — ${r.type}.`];
  if (r.carrier) {
    trParts.push(`Taşıyıcı: ${r.carrier}.`);
    enParts.push(`Carrier: ${r.carrier}.`);
  }
  if (r.repairSets.length) {
    trParts.push(`Uyumlu tamir setleri: ${r.repairSets.join(", ")}.`);
    enParts.push(`Compatible repair sets: ${r.repairSets.join(", ")}.`);
  }
  trParts.push("Orijinal parça numaraları yalnızca referans amaçlıdır.");
  enParts.push("Original part numbers are for reference purposes only.");
  return { tr: trParts.join(" "), en: enParts.join(" ") };
}

async function uploadImages(r: Row, s3: S3Client, bucket: string) {
  for (const file of r.images) {
    const path = join(IMG_DIR!, file);
    const size = statSync(path).size;
    const key = R2_PREFIX + file;
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if (head.ContentLength === size) continue;
    } catch {
      /* not found → upload */
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: readFileSync(path),
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }
}

async function main() {
  if (!SKIP_R2 && !IMG_DIR) throw new Error("--img-dir=... gerekli (veya --skip-r2)");
  if (IMG_DIR) for (const r of rows) for (const f of r.images) statSync(join(IMG_DIR, f));

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "moniva" }, select: { id: true } });
  const cats = await prisma.category.findMany({
    where: { code: { in: [...new Set(rows.map((r) => r.category))] } },
    select: { id: true, code: true },
  });
  const catId = new Map(cats.map((c) => [c.code, c.id]));
  for (const r of rows) if (!catId.has(r.category)) throw new Error(`Category ${r.category} not found`);

  const existing = new Set(
    (await prisma.product.findMany({ where: { sku: { in: rows.map((r) => r.sku) } }, select: { sku: true } })).map(
      (p) => p.sku,
    ),
  );
  const todo = rows.filter((r) => !existing.has(r.sku));
  const slugs = todo.map((r) => `${r.sku.toLowerCase()}-${slugify(r.nameEn)}`);
  const slugClash = await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true } });
  if (slugClash.length) throw new Error(`Slug clash: ${slugClash.map((s) => s.slug).join(", ")}`);

  const maxSort = (await prisma.product.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;
  const perCat: Record<string, number> = {};
  for (const r of todo) perCat[r.category] = (perCat[r.category] ?? 0) + 1;
  console.log({
    rows: rows.length,
    alreadyInDb: existing.size,
    toCreate: todo.length,
    perCategory: perCat,
    oemRefs: todo.reduce((n, r) => n + r.oem.length, 0),
    images: todo.reduce((n, r) => n + r.images.length, 0),
    sampleSlug: slugs[0],
  });
  if (DRY || todo.length === 0) return;

  let s3: S3Client | null = null;
  const bucket = process.env.R2_BUCKET!;
  if (!SKIP_R2) {
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    });
  }

  let created = 0;
  for (const [i, r] of todo.entries()) {
    if (s3) await uploadImages(r, s3, bucket);
    const d = descriptions(r);
    const specs = [
      { key: "Kaliper Tipi", value: r.type },
      ...(r.carrier ? [{ key: "Taşıyıcı (Carrier)", value: r.carrier }] : []),
      ...(r.repairSets.length ? [{ key: "Uyumlu Tamir Setleri", value: r.repairSets.join(", ") }] : []),
    ];
    await prisma.product.create({
      data: {
        sku: r.sku,
        slug: slugs[i],
        partType: "AFTERMARKET",
        isActive: true,
        sortOrder: maxSort + 1 + i,
        categoryId: catId.get(r.category)!,
        brandId: brand.id,
        translations: {
          create: [
            { locale: "TR", name: r.nameTr, description: d.tr },
            { locale: "EN", name: r.nameEn, description: d.en },
          ],
        },
        specs: { create: specs.map((s, order) => ({ ...s, order })) },
        oemReferences: {
          create: r.oem.map((o) => ({
            oemNumber: o.number,
            oemNumberNormalized: normalizeOem(o.number),
            manufacturer: o.manufacturer,
          })),
        },
        images: {
          create: r.images.map((file, order) => ({
            url: `/api/r2/${R2_PREFIX}${file}`,
            alt: `${r.sku} ${r.nameEn}`,
            order,
            isMain: order === 0,
          })),
        },
      },
    });
    created++;
  }
  console.log("created:", created);
}

main().finally(() => prisma.$disconnect());
