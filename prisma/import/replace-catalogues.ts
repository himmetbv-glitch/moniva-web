/**
 * Katalogları firma PDF'leriyle değiştirir.
 *
 * - Mevcut TÜM Catalogue kayıtlarını yedekleyip siler (1 yayında + 9 dosyasız
 *   seed/demo taslağı; kullanıcı "mevcut olanı kaldır" dedi). Eski R2 dosyası
 *   silinmez (zararsız, yedekten geri dönüş mümkün).
 * - "Kataloglar/" klasöründeki 5 PDF'i R2'ye yükler (catalogues/<slug>.pdf),
 *   PUBLISHED kayıtlar oluşturur (tip: brand). Sayfa sayısı macOS mdls ile.
 * - Idempotent: slug'a göre upsert; R2'de aynı boyutta nesne varsa yükleme atlanır.
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env --env-file=.env.local \
 *     prisma/import/replace-catalogues.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const SKIP_UPLOAD = process.argv.includes("--skip-upload"); // ikinci DB'ye uygularken

const SRC = join(process.cwd(), "Kataloglar");

const CATALOGUES = [
  { file: "1-Moniva - Knorr.pdf", slug: "moniva-knorr", title: "Moniva – Knorr", desc: "Knorr-Bremse kaliper programı için Moniva eşdeğerleri ve çapraz referanslar." },
  { file: "2-Moniva - Meritor.pdf", slug: "moniva-meritor", title: "Moniva – Meritor", desc: "Meritor kaliper programı için Moniva eşdeğerleri ve çapraz referanslar." },
  { file: "3-Moniva - Wabco.pdf", slug: "moniva-wabco", title: "Moniva – Wabco", desc: "Wabco kaliper programı için Moniva eşdeğerleri ve çapraz referanslar." },
  { file: "4-Moniva - Haldex.pdf", slug: "moniva-haldex", title: "Moniva – Haldex", desc: "Haldex kaliper programı için Moniva eşdeğerleri ve çapraz referanslar." },
  { file: "5-Moniva - Other.pdf", slug: "moniva-other", title: "Moniva – Other", desc: "Diğer markalar için Moniva eşdeğerleri ve çapraz referanslar." },
];

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
if (!accountId || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error("R2 env eksik (.env.local).");
  process.exit(1);
}
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function pageCount(path: string): number | null {
  try {
    const out = execSync(`mdls -name kMDItemNumberOfPages ${JSON.stringify(path)}`, { encoding: "utf8" });
    const m = out.match(/= (\d+)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

async function existsInR2(key: string, size: number): Promise<boolean> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength === size;
  } catch {
    return false;
  }
}

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Hedef DB: ${url.includes("localhost") ? "YEREL" : "UZAK (Neon)"}${DRY ? "  [DRY-RUN]" : ""}\n`);

  for (const c of CATALOGUES)
    if (!existsSync(join(SRC, c.file))) {
      console.error(`Dosya yok: ${c.file}`);
      process.exit(1);
    }

  // ── Yedek + mevcutları sil ──
  const existing = await prisma.catalogue.findMany({ include: { type: true } });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `/tmp/catalogues-backup-${stamp}.json`;
  writeFileSync(backup, JSON.stringify(existing, null, 1));
  console.log(`Yedek (${existing.length} kayıt): ${backup}`);

  const keepSlugs = new Set(CATALOGUES.map((c) => c.slug));
  const toDelete = existing.filter((e) => !keepSlugs.has(e.slug));
  console.log(`Silinecek: ${toDelete.length} kayıt (${toDelete.map((x) => x.slug).join(", ")})`);
  if (!DRY && toDelete.length)
    await prisma.catalogue.deleteMany({ where: { id: { in: toDelete.map((x) => x.id) } } });

  // ── Tip: brand ──
  const brand = await prisma.catalogueType.findUnique({ where: { slug: "brand" } });
  if (!brand) {
    console.error("CatalogueType slug='brand' bulunamadı.");
    process.exit(1);
  }

  // ── 5 katalog: R2 yükle + upsert ──
  console.log("");
  let order = 0;
  for (const c of CATALOGUES) {
    const path = join(SRC, c.file);
    const size = statSync(path).size;
    const key = `catalogues/${c.slug}.pdf`;
    const fileUrl = `/api/r2/${key}`;
    const pages = pageCount(path);

    let uploaded = "atlandı (zaten var)";
    if (!SKIP_UPLOAD && !(await existsInR2(key, size))) {
      if (!DRY)
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: readFileSync(path),
            ContentType: "application/pdf",
          }),
        );
      uploaded = "yüklendi";
    }

    const data = {
      title: c.title,
      typeId: brand.id,
      description: c.desc,
      version: "2026",
      languages: ["EN"],
      pageCount: pages,
      fileUrl,
      fileName: c.file.replace(/^\d+-/, ""),
      fileSize: size,
      status: "PUBLISHED" as const,
      featured: order === 0,
      order: order++,
    };
    if (!DRY)
      await prisma.catalogue.upsert({
        where: { slug: c.slug },
        create: { slug: c.slug, ...data },
        update: data,
      });
    console.log(
      `  ${c.slug.padEnd(16)} ${String(pages ?? "?").padStart(3)} sayfa  ${(size / 1e6).toFixed(1)} MB  R2:${uploaded}`,
    );
  }

  const left = await prisma.catalogue.count();
  console.log(`\nDB'de kalan katalog: ${DRY ? existing.length + " (dry-run)" : left}`);
  if (DRY) console.log("(dry-run — yazma yapılmadı)");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
