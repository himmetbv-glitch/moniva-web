/**
 * kaliper-resimler/*.{jpg,jpeg,png} → public/products/kaliper/{SKU}.{ext} kopyala
 * + ProductImage kaydı (isMain=true, order=0)
 *
 * Kurallar:
 * - Idempotent: aynı URL'ye sahip ProductImage varsa geçer
 * - Exact SKU match (kullanıcı direktifi: MON-/MNV-/MNVA- ayrı namespace, çevirme yok)
 * - DB'de olmayan SKU'lar (MNVA-* dahil) atlanır ve /tmp/kaliper-img-skipped.txt'e yazılır
 * - Kopyada mevcut hedef dosya varsa overwrite (kaynak = güncel varsayımı)
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const SRC = path.resolve(process.cwd(), "kaliper-resimler");
const DST = path.resolve(process.cwd(), "public/products/kaliper");
const PUBLIC_PREFIX = "/products/kaliper";
const prisma = new PrismaClient();

async function main() {
  if (!fs.existsSync(DST)) fs.mkdirSync(DST, { recursive: true });

  const files = fs.readdirSync(SRC).filter(f => /\.(jpe?g|png)$/i.test(f));
  console.log(`Kaynak dosya: ${files.length}`);

  const skus = files.map(f => path.parse(f).name);
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const skuToId = new Map(products.map(p => [p.sku, p.id]));
  console.log(`DB'de eşleşen ürün: ${products.length}`);

  const skipped: string[] = [];
  const stats = { copied: 0, imgCreated: 0, imgExisted: 0 };

  for (const file of files) {
    const sku = path.parse(file).name;
    const ext = path.extname(file).toLowerCase();
    const productId = skuToId.get(sku);
    if (!productId) { skipped.push(sku); continue; }

    const dstName = `${sku}${ext === ".jpeg" ? ".jpg" : ext}`;
    const dstPath = path.join(DST, dstName);
    fs.copyFileSync(path.join(SRC, file), dstPath);
    stats.copied++;

    const url = `${PUBLIC_PREFIX}/${dstName}`;
    const existing = await prisma.productImage.findFirst({
      where: { productId, url },
      select: { id: true },
    });
    if (existing) { stats.imgExisted++; continue; }

    await prisma.productImage.create({
      data: { productId, url, alt: sku, order: 0, isMain: true },
    });
    stats.imgCreated++;

    if (stats.copied % 200 === 0) {
      console.log(`   ${stats.copied}/${files.length} (yeni kayıt: ${stats.imgCreated})`);
    }
  }

  if (skipped.length) {
    fs.writeFileSync("/tmp/kaliper-img-skipped.txt", skipped.sort().join("\n"));
    console.log(`Atlanan (DB'de yok): ${skipped.length} → /tmp/kaliper-img-skipped.txt`);
  }

  console.log(`\n✅ TAMAM`);
  console.log(`   Kopyalanan dosya:     ${stats.copied}`);
  console.log(`   Yeni ProductImage:    ${stats.imgCreated}`);
  console.log(`   Zaten kayıtlı:        ${stats.imgExisted}`);
  console.log(`   Atlanan (DB'de yok):  ${skipped.length}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
