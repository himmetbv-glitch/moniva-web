/**
 * Bu oturumda eklenen 12 yeni kategoriyi geri alır:
 * 1. İçindeki ürünleri UNCAT kovasına taşı
 * 2. CategoryTranslation'ları sil (FK cascade)
 * 3. Kategori kayıtlarını sil
 *
 * Config kuralı: "YENİ TAKSONOMİ KATEGORİSİ YOK" (moniva-import.config.ts).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_CODES = ["FY","SCAM","BURC","KHPD","KHPE","FPBL","FPKL","FPTK","FPMR","FPMK","FPMP","BAGL"];

async function main() {
  const uncat = await prisma.category.findUnique({ where: { code: "UNCAT" } });
  if (!uncat) throw new Error("UNCAT bulunamadı");

  const cats = await prisma.category.findMany({
    where: { code: { in: NEW_CODES } },
    select: { id: true, code: true },
  });
  console.log(`Bulunan yeni kategori sayısı: ${cats.length}/${NEW_CODES.length}`);

  const catIds = cats.map(c => c.id);

  // 1) Ürünleri UNCAT'e taşı
  const moveResult = await prisma.product.updateMany({
    where: { categoryId: { in: catIds } },
    data: { categoryId: uncat.id },
  });
  console.log(`✓ ${moveResult.count} ürün UNCAT'e taşındı`);

  // 2) Category (ve cascade ile CategoryTranslation) sil
  const del = await prisma.category.deleteMany({
    where: { id: { in: catIds } },
  });
  console.log(`✓ ${del.count} kategori silindi`);

  const finalUncat = await prisma.product.count({ where: { categoryId: uncat.id } });
  const totalCats = await prisma.category.count();
  console.log(`\nSon durum: toplam kategori=${totalCats}, UNCAT'te ürün=${finalUncat}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
