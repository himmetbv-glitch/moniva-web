/**
 * PDF katalog'tan 6 test kaydı + 18 bileşen + KitComponent bağları.
 *
 * KURALLAR (kullanıcı direktifi):
 * - MNV- ve MON- iki AYRI namespace, tam string olarak SKU (asla normalize etme).
 * - Brand = Moniva (aftermarket). KNORR/SB5 markaya YAZILMAZ.
 * - "Kaliper Ailesi" (SB5/SB6/SB7/B DUCO/SB7 RADIAL vb.) → ProductSpec attribute.
 * - Bileşen (MNV-XXXX) hem müstakil Product hem başka kitlerin bileşeni olabilir.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAT_SET = "CK-SET"; // Komple Kaliper Setleri
const CAT_KIT = "CK-KIT"; // Kaliper Tamir Kitleri
const CAT_PRT = "CK-PRT"; // Kaliper Parçaları

// -----------------------------------------------------------------------------
// 6 KİT ANA KAYDI
// -----------------------------------------------------------------------------
type OemList = { number: string; manufacturer?: string }[];

type KitDef = {
  sku: string;
  categoryCode: string;
  name: string;
  family: string;               // Kaliper Ailesi
  oems: OemList;
  components: {
    sku: string;
    name: string;
    qty: number;
    dimension?: string;
    sortOrder: number;
  }[];
};

const KITS: KitDef[] = [
  {
    sku: "MNV-2209",
    categoryCode: CAT_KIT,
    name: "Caliper Adjuster Seal & Boot Repair Kit",
    family: "B DUCO TYPE",
    oems: [
      { number: "MCK1134" }, { number: "SJ4094" },
      { number: "1489198", manufacturer: "DAF" },
      { number: "3092255", manufacturer: "Volvo" },
      { number: "3095627", manufacturer: "Volvo" },
      { number: "85103892", manufacturer: "Volvo" },
      { number: "AMMCK1134" },
    ],
    components: [
      { sku: "MNV-2192", name: "Adjuster Dust Boot",           qty: 1, sortOrder: 1 },
      { sku: "MNV-2704", name: "Dust Excluder Retainer",       qty: 1, dimension: "Ø30 x 4 mm", sortOrder: 2 },
      { sku: "MNV-2627", name: "Adjuster Seal",                qty: 1, sortOrder: 3 },
    ],
  },
  {
    sku: "MNV-2111",
    categoryCode: CAT_PRT,
    name: "Caliper Tappet Dust Covers",
    family: "B DUCO TYPE",
    oems: [
      { number: "MCK1139" }, { number: "MCK1288" }, { number: "68324854PK10" },
      { number: "35.40311.2182", manufacturer: "MAN" },
      { number: "81.50802.6024", manufacturer: "MAN" },
      { number: "1487339", manufacturer: "DAF" },
      { number: "85107913", manufacturer: "Volvo" },
      { number: "0501215022", manufacturer: "ZF" },
      { number: "5006 028 414", manufacturer: "Renault" },
      { number: "5021 179 952", manufacturer: "Renault" },
    ],
    components: [
      { sku: "MNV-2584", name: "Tappet Dust Cover", qty: 2, sortOrder: 1 },
    ],
  },
  {
    sku: "MON-1139",
    categoryCode: CAT_SET,
    name: "Caliper Complete Mechanism Repair Kit (SB6)",
    family: "SB6/SB7 TYPE",
    oems: [],
    components: [
      { sku: "MNV-1163", name: "Caliper Bridge Assembly Kit",           qty: 1, sortOrder: 1 },
      { sku: "MNV-1035", name: "Caliper Lever (Angle 0° - 113 mm)",     qty: 1, sortOrder: 2 },
      { sku: "MNV-1030", name: "Caliper Adjusting Shaft (with Spring)", qty: 1, sortOrder: 3 },
      { sku: "MNV-1029", name: "Caliper Adjusting Mechanism",           qty: 1, sortOrder: 4 },
      { sku: "MNV-1031", name: "Caliper Chain (29 Links)",              qty: 1, sortOrder: 5 },
      { sku: "MNV-1016", name: "Caliper Piston Tappet & Seals Repair Kit", qty: 1, sortOrder: 6 },
      { sku: "MNV-1168", name: "Caliper Roller Bearings",               qty: 1, sortOrder: 7 },
    ],
  },
  {
    sku: "MNV-1016",
    categoryCode: CAT_KIT,
    name: "Caliper Piston Tappet & Seals Repair Kit",
    family: "SB5 TYPE",
    oems: [
      { number: "K000944", manufacturer: "Knorr-Bremse" },
      { number: "K010604", manufacturer: "Knorr-Bremse" },
      { number: "000 420 0682", manufacturer: "Mercedes-Benz" },
      { number: "000 420 3982", manufacturer: "Mercedes-Benz" },
      { number: "000 420 4882", manufacturer: "Mercedes-Benz" },
      { number: "81.50822.6007", manufacturer: "MAN" },
      { number: "81.50822.6022", manufacturer: "MAN" },
      { number: "81.50822.6032", manufacturer: "MAN" },
      { number: "1743421", manufacturer: "Scania" },
      { number: "1746824", manufacturer: "Scania" },
      { number: "1756389", manufacturer: "Scania" },
      { number: "1759811", manufacturer: "Scania" },
      { number: "1723414", manufacturer: "Scania" },
      { number: "2121859", manufacturer: "Scania" },
      { number: "1448913", manufacturer: "DAF" },
      { number: "1623221", manufacturer: "DAF" },
      { number: "93162050B", manufacturer: "Iveco" },
      { number: "09.801.02.63.0", manufacturer: "Iveco" },
      { number: "3 434 3804 00", manufacturer: "SAF" },
      { number: "8 531 7002 800", manufacturer: "SAF" },
    ],
    components: [
      { sku: "MNV-1533", name: "Tappet & Boot Assembly", qty: 2, dimension: "Ø74 mm", sortOrder: 1 },
      { sku: "MNV-1537", name: "Inner Seal (for Ø74 mm)", qty: 2, sortOrder: 2 },
      { sku: "MNV-1520", name: "Teflon Bush", qty: 2, dimension: "Ø18 x Ø16 x 10 mm", sortOrder: 3 },
    ],
  },
  {
    sku: "MON-1143",
    categoryCode: CAT_SET,
    name: "Caliper Complete Repair Set (Scania)", // Katalog "SCAINA" yazımı hatalı — düzeltildi
    family: "SB7 RADIAL TYPE",
    oems: [],
    components: [
      { sku: "MNV-1163", name: "Caliper Bridge Assembly Kit",           qty: 1, sortOrder: 1 },
      { sku: "MNV-1016", name: "Caliper Piston Tappet & Seals Repair Kit", qty: 1, sortOrder: 2 },
      { sku: "MNV-1168", name: "Caliper Roller Bearings",               qty: 1, sortOrder: 3 },
      { sku: "MNV-1030", name: "Caliper Adjusting Shaft (with Spring)", qty: 1, sortOrder: 4 },
      { sku: "MNV-1029", name: "Caliper Adjusting Mechanism",           qty: 1, sortOrder: 5 },
      { sku: "MNV-1031", name: "Caliper Chain (29 Links)",              qty: 1, sortOrder: 6 },
      { sku: "MNV-1186", name: "Caliper Lever",                         qty: 1, sortOrder: 7 },
    ],
  },
  {
    sku: "MON-1144",
    categoryCode: CAT_SET,
    name: "Caliper Complete Mechanism Repair Kit (SB7 Radial)",
    family: "SB7 RADIAL TYPE",
    oems: [],
    components: [
      { sku: "MNV-1161", name: "Caliper Bridge Assembly Kit",           qty: 1, sortOrder: 1 },
      { sku: "MNV-1597", name: "Lever Bearing",                         qty: 1, sortOrder: 2 },
      { sku: "MNV-1030", name: "Caliper Adjusting Shaft (with Spring)", qty: 1, sortOrder: 3 },
      { sku: "MNV-1029", name: "Caliper Adjusting Mechanism",           qty: 1, sortOrder: 4 },
      { sku: "MNV-1031", name: "Caliper Chain (29 Links)",              qty: 1, sortOrder: 5 },
      { sku: "MNV-1127", name: "Caliper Piston Tappet & Seals Repair Kit", qty: 1, sortOrder: 6 },
      { sku: "MNV-1005", name: "Caliper Roller Bearings",               qty: 1, sortOrder: 7 },
    ],
  },
];

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

function normalizeOem(v: string) {
  return v.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function main() {
  // Lookup: kategori kod → id
  const cats = await prisma.category.findMany({
    where: { code: { in: [CAT_SET, CAT_KIT, CAT_PRT] } },
    select: { id: true, code: true },
  });
  const catId = new Map(cats.map(c => [c.code, c.id]));
  for (const k of [CAT_SET, CAT_KIT, CAT_PRT]) {
    if (!catId.get(k)) throw new Error(`Kategori bulunamadı: ${k}`);
  }

  const moniva = await prisma.brand.findUnique({ where: { slug: "moniva" }, select: { id: true } });
  if (!moniva) throw new Error("Moniva markası bulunamadı");

  // ---------------------------------------------------------------------------
  // 1) KİTLER İÇİN BİLEŞENLERİ TOPLAYALIM
  //    (aynı bileşen birden çok kitte geçebilir — unique dict)
  // ---------------------------------------------------------------------------
  type ComponentSeed = { sku: string; name: string };
  const componentMap = new Map<string, ComponentSeed>();
  for (const kit of KITS) {
    for (const c of kit.components) {
      // MNV-1016 aynı zamanda kit → adı kit'ten alacağız (daha güvenilir)
      if (!componentMap.has(c.sku)) componentMap.set(c.sku, { sku: c.sku, name: c.name });
    }
  }
  // Kit'lerin kendisi de bir Product; MNV-1016 hem componentMap'te hem KITS'te var — OK
  const kitSkus = new Set(KITS.map(k => k.sku));
  const pureComponents = [...componentMap.values()].filter(c => !kitSkus.has(c.sku));

  console.log(`Toplam kit: ${KITS.length}`);
  console.log(`Unique bileşen: ${componentMap.size}  (kit olmayanlar: ${pureComponents.length})`);

  // ---------------------------------------------------------------------------
  // 2) ÖNCE SAF BİLEŞENLERİ (kit değil) UPSERT
  //    Kategori: CK-PRT, brand: Moniva, minimum bilgi
  // ---------------------------------------------------------------------------
  console.log(`\n1) Saf bileşenler upsert…`);
  for (const c of pureComponents) {
    await prisma.product.upsert({
      where: { sku: c.sku },
      update: {
        translations: {
          upsert: [{
            where: { productId_locale: { productId: (await prisma.product.findUnique({ where: { sku: c.sku }, select: { id: true } }))?.id ?? "__none__", locale: "TR" } },
            update: { name: c.name },
            create: { locale: "TR", name: c.name, description: c.name },
          }],
        },
      },
      create: {
        sku: c.sku,
        slug: slugify(`${c.sku}-${c.name}`).slice(0, 80),
        categoryId: catId.get(CAT_PRT)!,
        brandId: moniva.id,
        isActive: true,
        partType: "AFTERMARKET",
        translations: { create: [{ locale: "TR", name: c.name, description: c.name }] },
      },
    });
    console.log(`   ✓ ${c.sku}  ${c.name}`);
  }

  // ---------------------------------------------------------------------------
  // 3) KİT ANA KAYITLARINI UPSERT (OEM + Kaliper Ailesi spec dahil)
  // ---------------------------------------------------------------------------
  console.log(`\n2) Kit ana kayıtları upsert…`);
  for (const kit of KITS) {
    const existing = await prisma.product.findUnique({ where: { sku: kit.sku }, select: { id: true } });
    const productData = {
      slug: slugify(`${kit.sku}-${kit.name}`).slice(0, 80),
      categoryId: catId.get(kit.categoryCode)!,
      brandId: moniva.id,
      isActive: true,
      partType: "AFTERMARKET" as const,
    };
    let p;
    if (existing) {
      p = await prisma.product.update({ where: { sku: kit.sku }, data: productData });
    } else {
      p = await prisma.product.create({
        data: {
          sku: kit.sku,
          ...productData,
          translations: { create: [{ locale: "TR", name: kit.name, description: kit.name }] },
        },
      });
    }

    // TR translation upsert (varsa güncelle)
    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId: p.id, locale: "TR" } },
      update: { name: kit.name, description: kit.name },
      create: { productId: p.id, locale: "TR", name: kit.name, description: kit.name },
    });

    // Kaliper Ailesi spec (idempotent)
    const familySpec = await prisma.productSpec.findFirst({
      where: { productId: p.id, key: "Kaliper Ailesi" },
    });
    if (!familySpec) {
      await prisma.productSpec.create({
        data: { productId: p.id, key: "Kaliper Ailesi", value: kit.family, order: 0 },
      });
    } else if (familySpec.value !== kit.family) {
      await prisma.productSpec.update({ where: { id: familySpec.id }, data: { value: kit.family } });
    }

    // OEM referansları (varsa atla)
    for (const oem of kit.oems) {
      const exists = await prisma.oemReference.findFirst({
        where: { productId: p.id, oemNumber: oem.number },
      });
      if (!exists) {
        await prisma.oemReference.create({
          data: {
            productId: p.id,
            oemNumber: oem.number,
            oemNumberNormalized: normalizeOem(oem.number),
            manufacturer: oem.manufacturer ?? null,
          },
        });
      }
    }
    console.log(`   ✓ ${kit.sku}  ${kit.name}  [${kit.categoryCode}]  (${kit.oems.length} OEM)`);
  }

  // ---------------------------------------------------------------------------
  // 4) KIT COMPONENT BAĞLARI (parentProductId × componentProductId)
  // ---------------------------------------------------------------------------
  console.log(`\n3) KitComponent bağları…`);
  let bagCount = 0;
  for (const kit of KITS) {
    const parent = await prisma.product.findUnique({ where: { sku: kit.sku }, select: { id: true } });
    if (!parent) throw new Error(`Kit bulunamadı: ${kit.sku}`);
    for (const c of kit.components) {
      const comp = await prisma.product.findUnique({ where: { sku: c.sku }, select: { id: true } });
      if (!comp) throw new Error(`Bileşen bulunamadı: ${c.sku}`);
      await prisma.kitComponent.upsert({
        where: { parentProductId_componentProductId: { parentProductId: parent.id, componentProductId: comp.id } },
        update: { qty: c.qty, dimension: c.dimension ?? null, sortOrder: c.sortOrder },
        create: {
          parentProductId: parent.id,
          componentProductId: comp.id,
          qty: c.qty,
          dimension: c.dimension ?? null,
          sortOrder: c.sortOrder,
        },
      });
      bagCount++;
    }
    console.log(`   ✓ ${kit.sku} → ${kit.components.length} bileşen`);
  }

  console.log(`\n✅ Tamam: ${KITS.length} kit + ${pureComponents.length} saf bileşen + ${bagCount} KitComponent bağı`);

  // Nested test doğrulaması: MNV-1016 kaç kitte kullanılıyor
  const mnv1016 = await prisma.product.findUnique({
    where: { sku: "MNV-1016" },
    include: { usedInKits: { include: { parent: { select: { sku: true } } } } },
  });
  if (mnv1016) {
    console.log(`\n🔗 Nested test — MNV-1016 kullanıldığı kitler:`);
    for (const u of mnv1016.usedInKits) console.log(`   ← ${u.parent.sku}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
