/**
 * catalog.json (parse_catalog.py çıktısı) → yerel DB toplu upsert.
 *
 * Kurallar:
 * - Idempotent: mevcut SKU'lar update, yeni SKU'lar create
 * - Brand = Moniva (aftermarket)
 * - Kategori: catalog.category_code (CK-SET/KIT/PRT) — yoksa CK-PRT default
 * - Kaliper Ailesi → ProductSpec key="Kaliper Ailesi"
 * - OEM referansları upsert (idempotent)
 * - Bileşen olarak refere edilen MNV-XXXX'ler eğer ana kayıt yoksa
 *   otomatik CK-PRT olarak yaratılır (min bilgi)
 * - KitComponent bağları upsert
 *
 * DİKKAT: mevcut ürünlerin adını override etmez (upsert.update TR name atlanır).
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

type Oem = { number: string; manufacturer: string | null };
type Comp = { sortOrder: number; sku: string; name: string; qty: number; dimension: string | null };
type CatProduct = {
  sku: string;
  name: string;
  family: string | null;
  category_code: string;
  oems: Oem[];
  components: Comp[];
  page: number;
};

const JSON_PATH = "/tmp/moniva_scrape/catalog.json";
const prisma = new PrismaClient();

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function normalizeOem(v: string) { return v.replace(/[^a-z0-9]/gi, "").toLowerCase(); }

async function main() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  const products: CatProduct[] = data.products;
  console.log(`Katalog: ${products.length} ana kayıt`);

  // Kategori lookup
  const cats = await prisma.category.findMany({
    where: { code: { in: ["CK-SET", "CK-KIT", "CK-PRT"] } },
    select: { id: true, code: true },
  });
  const catId = new Map(cats.map(c => [c.code, c.id]));
  const defaultCat = catId.get("CK-PRT")!;
  const moniva = await prisma.brand.findUnique({ where: { slug: "moniva" }, select: { id: true } });
  if (!moniva) throw new Error("Moniva markası bulunamadı");

  // -------------------------------------------------------------------------
  // Faz 1: Bileşen olarak refere edilenleri topla — bunları da (yoksa) yaratacağız
  // -------------------------------------------------------------------------
  type Bileşen = { sku: string; name: string };
  const componentSeeds = new Map<string, Bileşen>();
  for (const p of products) {
    for (const c of p.components) {
      if (!componentSeeds.has(c.sku)) componentSeeds.set(c.sku, { sku: c.sku, name: c.name });
    }
  }
  const kitSkus = new Set(products.map(p => p.sku));
  const orphanComponents = [...componentSeeds.values()].filter(c => !kitSkus.has(c.sku));
  console.log(`Bileşen referansı: ${componentSeeds.size}, ana kayıt olmayan bileşen: ${orphanComponents.length}`);

  // -------------------------------------------------------------------------
  // Faz 2: Ana kayıtları upsert (ürünler)
  // -------------------------------------------------------------------------
  const stats = { created: 0, updated: 0, skippedName: 0 };
  console.log(`\n1) Ana kayıtlar upsert…`);
  let i = 0;
  for (const p of products) {
    i++;
    const cid = catId.get(p.category_code) ?? defaultCat;
    const nameHasPlaceholder = /^Caliper Part MNV-/.test(p.name);

    const existing = await prisma.product.findUnique({ where: { sku: p.sku }, select: { id: true } });

    let product;
    if (!existing) {
      product = await prisma.product.create({
        data: {
          sku: p.sku,
          slug: slugify(`${p.sku}-${p.name}`).slice(0, 80),
          categoryId: cid,
          brandId: moniva.id,
          isActive: true,
          partType: "AFTERMARKET",
          translations: { create: [{ locale: "TR", name: p.name, description: p.name }] },
        },
      });
      stats.created++;
    } else {
      // İsim override yapma — mevcut isim varsa dokunma. Sadece kategori güncelle.
      product = await prisma.product.update({
        where: { id: existing.id },
        data: { categoryId: cid },
      });

      // Eğer TR translation yoksa yarat
      const trExists = await prisma.productTranslation.findUnique({
        where: { productId_locale: { productId: existing.id, locale: "TR" } },
      });
      if (!trExists) {
        await prisma.productTranslation.create({
          data: { productId: existing.id, locale: "TR", name: p.name, description: p.name },
        });
      } else if (nameHasPlaceholder) {
        stats.skippedName++; // placeholder isim atla
      }
      stats.updated++;
    }

    // Kaliper Ailesi → ProductSpec (varsa güncelle, yoksa yarat)
    if (p.family) {
      const fs = await prisma.productSpec.findFirst({ where: { productId: product.id, key: "Kaliper Ailesi" } });
      if (!fs) {
        await prisma.productSpec.create({ data: { productId: product.id, key: "Kaliper Ailesi", value: p.family, order: 0 } });
      } else if (fs.value !== p.family) {
        await prisma.productSpec.update({ where: { id: fs.id }, data: { value: p.family } });
      }
    }

    // OEM referansları
    for (const oem of p.oems) {
      if (!oem.number || oem.number.length > 120) continue; // gürültü kontrol
      const exists = await prisma.oemReference.findFirst({
        where: { productId: product.id, oemNumber: oem.number },
      });
      if (!exists) {
        try {
          await prisma.oemReference.create({
            data: {
              productId: product.id,
              oemNumber: oem.number,
              oemNumberNormalized: normalizeOem(oem.number),
              manufacturer: oem.manufacturer,
            },
          });
        } catch { /* unique constraint çakışması olabilir, geç */ }
      }
    }

    if (i % 100 === 0) console.log(`   ${i}/${products.length}  (created=${stats.created}, updated=${stats.updated})`);
  }

  // -------------------------------------------------------------------------
  // Faz 3: Orphan bileşenleri CK-PRT olarak yarat
  // -------------------------------------------------------------------------
  console.log(`\n2) Orphan bileşenler upsert (${orphanComponents.length} tane)…`);
  let orphanCreated = 0;
  for (const c of orphanComponents) {
    const existing = await prisma.product.findUnique({ where: { sku: c.sku }, select: { id: true } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        sku: c.sku,
        slug: slugify(`${c.sku}-${c.name}`).slice(0, 80),
        categoryId: catId.get("CK-PRT")!,
        brandId: moniva.id,
        isActive: true,
        partType: "AFTERMARKET",
        translations: { create: [{ locale: "TR", name: c.name, description: c.name }] },
      },
    });
    orphanCreated++;
  }
  console.log(`   ✓ ${orphanCreated} orphan bileşen yaratıldı`);

  // -------------------------------------------------------------------------
  // Faz 4: KitComponent bağları
  // -------------------------------------------------------------------------
  console.log(`\n3) KitComponent bağları…`);
  // Tüm SKU → id lookup için tek sorgu (perf)
  const allSkus = new Set<string>();
  for (const p of products) {
    allSkus.add(p.sku);
    for (const c of p.components) allSkus.add(c.sku);
  }
  const allProds = await prisma.product.findMany({
    where: { sku: { in: [...allSkus] } },
    select: { id: true, sku: true },
  });
  const skuToId = new Map(allProds.map(p => [p.sku, p.id]));

  let bindCreated = 0, bindSkipped = 0;
  for (const p of products) {
    const parentId = skuToId.get(p.sku);
    if (!parentId) continue;
    for (const c of p.components) {
      const compId = skuToId.get(c.sku);
      if (!compId) { bindSkipped++; continue; }
      if (parentId === compId) { bindSkipped++; continue; } // self-ref koruma
      try {
        await prisma.kitComponent.upsert({
          where: { parentProductId_componentProductId: { parentProductId: parentId, componentProductId: compId } },
          update: { qty: c.qty, dimension: c.dimension, sortOrder: c.sortOrder },
          create: {
            parentProductId: parentId,
            componentProductId: compId,
            qty: c.qty,
            dimension: c.dimension,
            sortOrder: c.sortOrder,
          },
        });
        bindCreated++;
      } catch { bindSkipped++; }
    }
  }
  console.log(`   ✓ KitComponent bağı: ${bindCreated} (atlanan: ${bindSkipped})`);

  // -------------------------------------------------------------------------
  // Özet
  // -------------------------------------------------------------------------
  console.log(`\n✅ TAMAM`);
  console.log(`  Ana kayıt: created=${stats.created}  updated=${stats.updated}  placeholder-isim=${stats.skippedName}`);
  console.log(`  Orphan bileşen yaratıldı: ${orphanCreated}`);
  console.log(`  KitComponent bağı: ${bindCreated}`);
  const total = await prisma.product.count({ where: { category: { code: { in: ["CK", "CK-SET", "CK-KIT", "CK-PRT"] } } } });
  console.log(`  DB'deki toplam kaliper ürünü: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
