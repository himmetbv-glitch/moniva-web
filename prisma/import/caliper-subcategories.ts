/**
 * KALİPER (CK) altına 3 alt kategori ekle:
 *   - Komple Kaliper Setleri
 *   - Tamir Kitleri
 *   - Kaliper Parçaları
 * Kullanıcı kararı: aile bilgisi (KNORR SB5 vb.) burada değil, ayrı "Kaliper Ailesi" attribute'ünde.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHILDREN = [
  { code: "CK-SET", slug: "komple-kaliper-setleri", nameTr: "Komple Kaliper Setleri", order: 1 },
  { code: "CK-KIT", slug: "kaliper-tamir-kitleri",  nameTr: "Kaliper Tamir Kitleri",  order: 2 },
  { code: "CK-PRT", slug: "kaliper-parcalari",      nameTr: "Kaliper Parçaları",      order: 3 },
];

async function main() {
  const parent = await prisma.category.findUnique({ where: { code: "CK" } });
  if (!parent) throw new Error("Parent kategori CK (Kaliper) bulunamadı");
  console.log(`Parent: ${parent.code} (id=${parent.id})`);

  for (const c of CHILDREN) {
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      update: { parentId: parent.id, order: c.order, showInMenu: true, isActive: true },
      create: {
        code: c.code,
        slug: c.slug,
        order: c.order,
        parentId: parent.id,
        isActive: true,
        showInMenu: true,
        translations: { create: [{ locale: "TR", name: c.nameTr }] },
      },
    });
    console.log(`  ✓ ${c.code}  ${c.nameTr}  (id=${cat.id})`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
