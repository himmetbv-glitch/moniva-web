/**
 * Ürün görsellerini YEREL olarak bağlar. R2'ye / canlıya DOKUNMAZ.
 * Çalıştır: npx tsx prisma/import/attach-images-local.ts
 *
 * - Kaynak: ~/Desktop/moniva_urunler/*.jpg  (dosya adı = ürün kodu, ayraçsız)
 * - Görsel dosyaları public/product-images/{normKod}.{ext} altına KOPYALANIR.
 * - Her eşleşen ürüne ProductImage kaydı (url = /product-images/{normKod}.{ext}).
 * - Idempotent: aynı url zaten varsa atlar; yeniden çalıştırınca kopya oluşturmaz.
 * - Eşleşmeyen görseller (orphan) atlanır, listesi _image-orphans.txt'e yazılır.
 */
import * as fs from "fs";
import * as path from "path";

import { prisma } from "../../src/lib/prisma";
import { normalizeOem } from "../../src/lib/products/normalize-oem";

const SRC_DIR = "/Users/himmetbuyukvadi/Desktop/moniva_urunler";
const PUBLIC_SUBDIR = "product-images";
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEST_DIR = path.join(PROJECT_ROOT, "public", PUBLIC_SUBDIR);

async function main() {
  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  // normalize(MNV kodu) -> productId[]
  const mnv = await prisma.oemReference.findMany({
    where: { manufacturer: "MNV" },
    select: { oemNumberNormalized: true, productId: true },
  });
  const normToPids = new Map<string, string[]>();
  for (const o of mnv) {
    const arr = normToPids.get(o.oemNumberNormalized) ?? [];
    arr.push(o.productId);
    normToPids.set(o.oemNumberNormalized, arr);
  }

  // ürün adı (alt için)
  const names = await prisma.productTranslation.findMany({
    where: { locale: "TR" },
    select: { productId: true, name: true },
  });
  const nameOf = new Map(names.map((n) => [n.productId, n.name]));

  fs.mkdirSync(DEST_DIR, { recursive: true });

  let created = 0;
  let skippedExisting = 0;
  let copied = 0;
  const orphans: string[] = [];

  for (const file of files) {
    const base = file.replace(/\.[^.]+$/, "");
    const ext = path.extname(file).slice(1).toLowerCase();
    const norm = normalizeOem(base);
    const pids = normToPids.get(norm);
    if (!pids || pids.length === 0) {
      orphans.push(base);
      continue;
    }

    // Görseli public/product-images/{norm}.{ext} altına kopyala (bir kez)
    const destName = `${norm}.${ext}`;
    const destPath = path.join(DEST_DIR, destName);
    const url = `/${PUBLIC_SUBDIR}/${destName}`;
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(path.join(SRC_DIR, file), destPath);
      copied++;
    }

    for (const pid of pids) {
      const existing = await prisma.productImage.findFirst({
        where: { productId: pid, url },
        select: { id: true },
      });
      if (existing) {
        skippedExisting++;
        continue;
      }
      const agg = await prisma.productImage.aggregate({
        where: { productId: pid },
        _max: { order: true },
        _count: true,
      });
      const order = (agg._max.order ?? -1) + 1;
      const isMain = agg._count === 0; // görseli olmayan üründe kapak yap
      await prisma.productImage.create({
        data: {
          productId: pid,
          url,
          alt: nameOf.get(pid) ?? base,
          order,
          isMain,
        },
      });
      created++;
    }
  }

  if (orphans.length) {
    fs.writeFileSync(
      path.join(__dirname, "_image-orphans.txt"),
      orphans.sort().join("\n") + "\n",
    );
  }

  console.log("=== YEREL GÖRSEL BAĞLAMA BİTTİ ===");
  console.log(`Kaynak görsel: ${files.length}`);
  console.log(`  public/'e kopyalanan dosya: ${copied}`);
  console.log(`  Oluşturulan ProductImage: ${created}`);
  console.log(`  Zaten var (atlandı): ${skippedExisting}`);
  console.log(`  Eşleşmeyen (orphan): ${orphans.length}  → prisma/import/_image-orphans.txt`);

  const withImg = await prisma.product.count({ where: { images: { some: {} } } });
  console.log(`\nArtık görseli olan ürün: ${withImg}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
