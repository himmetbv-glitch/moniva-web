/**
 * Kategorisiz (UNCAT) kovadaki 583 ürünü SKU prefix'ine göre yeni root kategorilere taşır.
 * - 12 yeni root kategori upsert (parent yok, showInMenu=true)
 * - UNCAT'teki her ürünü SKU prefix (MNV-{PREFIX}-...) eşleşmesiyle yeni kategoriye update
 * - Idempotent: tekrar çalıştırılırsa yalnızca hâlâ UNCAT'te olanları taşır
 * - Salt veri operasyonu — migration gerekmez
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type NewCat = { code: string; slug: string; nameTr: string; order: number };

const NEW_CATEGORIES: NewCat[] = [
  { code: "FY",   slug: "fren-yayi",                    nameTr: "FREN YAYI",                      order: 100 },
  { code: "SCAM", slug: "s-kam-mili",                   nameTr: "S-KAM MİLİ",                     order: 101 },
  { code: "BURC", slug: "burc",                         nameTr: "BURÇ",                           order: 102 },
  { code: "KHPD", slug: "kuru-hava-fren-paneli-dingil", nameTr: "KURU HAVA FREN PANELİ (DİNGİL)", order: 103 },
  { code: "KHPE", slug: "panel-etek-saci",              nameTr: "PANEL ETEK SACI",                order: 104 },
  { code: "FPBL", slug: "fren-pabuc-balatasi",          nameTr: "FREN PABUÇ BALATASI",            order: 105 },
  { code: "FPKL", slug: "fren-pabuc-kilidi",            nameTr: "FREN PABUÇ KİLİDİ",              order: 106 },
  { code: "FPTK", slug: "fren-pabuc-tamir-takimi",      nameTr: "FREN PABUÇ TAMİR TAKIMI",        order: 107 },
  { code: "FPMR", slug: "fren-pabuc-makarasi",          nameTr: "FREN PABUÇ MAKARASI",            order: 108 },
  { code: "FPMK", slug: "fren-pabuc-kilitli-makarasi",  nameTr: "FREN PABUÇ KİLİTLİ MAKARASI",    order: 109 },
  { code: "FPMP", slug: "fren-pabuc-makara-kilit-pimi", nameTr: "FREN PABUÇ MAKARA KİLİT PİMİ",   order: 110 },
  { code: "BAGL", slug: "baglanti-elemani",             nameTr: "BAĞLANTI ELEMANI",               order: 111 },
];

async function main() {
  const uncat = await prisma.category.findUnique({ where: { code: "UNCAT" } });
  if (!uncat) throw new Error("UNCAT kategorisi bulunamadı");

  console.log(`\n1) ${NEW_CATEGORIES.length} yeni kategori upsert ediliyor…`);
  const codeToId: Record<string, string> = {};
  for (const c of NEW_CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        slug: c.slug,
        order: c.order,
        isActive: true,
        showInMenu: true,
        translations: { create: [{ locale: "TR", name: c.nameTr }] },
      },
    });
    codeToId[c.code] = cat.id;
    console.log(`   ✓ ${c.code.padEnd(5)} ${c.nameTr}`);
  }

  console.log(`\n2) UNCAT'teki ürünler SKU prefix'ine göre taşınıyor…`);
  const uncatProducts = await prisma.product.findMany({
    where: { categoryId: uncat.id },
    select: { id: true, sku: true },
  });
  console.log(`   Hedefteki ürün: ${uncatProducts.length}`);

  const perPrefix: Record<string, number> = {};
  const notMoved: { sku: string; prefix: string }[] = [];
  let moved = 0;

  for (const p of uncatProducts) {
    const m = p.sku.match(/^MNV-([A-Z]+)-\d+$/);
    if (!m) { notMoved.push({ sku: p.sku, prefix: "?" }); continue; }
    const prefix = m[1];
    const targetId = codeToId[prefix];
    if (!targetId) { notMoved.push({ sku: p.sku, prefix }); continue; }
    await prisma.product.update({ where: { id: p.id }, data: { categoryId: targetId } });
    perPrefix[prefix] = (perPrefix[prefix] ?? 0) + 1;
    moved++;
  }

  console.log(`\n3) Sonuç:`);
  console.log(`   Taşınan toplam: ${moved}/${uncatProducts.length}`);
  for (const [prefix, n] of Object.entries(perPrefix).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${prefix.padEnd(5)} → ${n} ürün`);
  }
  if (notMoved.length) {
    console.log(`\n   ⚠ Taşınamayan (bilinmeyen prefix): ${notMoved.length}`);
    for (const nm of notMoved.slice(0, 10)) console.log(`   - ${nm.sku} (prefix: ${nm.prefix})`);
  }

  const remainingUncat = await prisma.product.count({ where: { categoryId: uncat.id } });
  console.log(`\n   UNCAT kovada kalan: ${remainingUncat}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
