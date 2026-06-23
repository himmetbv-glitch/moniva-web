import { PrismaClient, Locale, PartType } from "@prisma/client";
import bcrypt from "bcrypt";

import { normalizeOem } from "../src/lib/products/normalize-oem";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed başlıyor...");

  // --------------------------------------------------------------------------
  // ADMIN USER
  // --------------------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@moniva.com.tr" },
    update: {},
    create: {
      email: "admin@moniva.com.tr",
      name: "Moniva Admin",
      password: adminPasswordHash,
      role: "ADMIN",
      isVerified: true,
      isActive: true,
      companyName: "Moniva",
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // --------------------------------------------------------------------------
  // BRANDS
  // --------------------------------------------------------------------------
  const moniva = await prisma.brand.upsert({
    where: { slug: "moniva" },
    update: {},
    create: { name: "Moniva", slug: "moniva", isActive: true },
  });
  console.log(`✓ Marka: ${moniva.name}`);

  // --------------------------------------------------------------------------
  // CATEGORIES — hiyerarşik, çeviri ile
  // --------------------------------------------------------------------------
  type CategorySeed = {
    code: string;
    slug: string;
    order: number;
    translations: { locale: Locale; name: string }[];
    children?: Omit<CategorySeed, "children">[];
  };

  const categorySeeds: CategorySeed[] = [
    {
      code: "AS",
      slug: "air-suspension",
      order: 1,
      translations: [
        { locale: "TR", name: "Hava Süspansiyon" },
        { locale: "EN", name: "Air Suspension" },
        { locale: "RU", name: "Пневмоподвеска" },
        { locale: "AR", name: "تعليق هوائي" },
      ],
    },
    {
      code: "AW",
      slug: "axle-wheel",
      order: 2,
      translations: [
        { locale: "TR", name: "Aks ve Tekerlek" },
        { locale: "EN", name: "Axle & Wheel" },
        { locale: "RU", name: "Ось и колесо" },
        { locale: "AR", name: "المحور والعجلة" },
      ],
    },
    {
      code: "CK",
      slug: "caliper",
      order: 3,
      translations: [
        { locale: "TR", name: "Kaliper" },
        { locale: "EN", name: "Caliper" },
        { locale: "RU", name: "Суппорт" },
        { locale: "AR", name: "كاليبر" },
      ],
    },
    {
      code: "BD",
      slug: "brake-systems",
      order: 4,
      translations: [
        { locale: "TR", name: "Fren Sistemleri" },
        { locale: "EN", name: "Brake Systems" },
        { locale: "RU", name: "Тормозные системы" },
        { locale: "AR", name: "أنظمة الفرامل" },
      ],
      children: [
        {
          code: "BD-SPR",
          slug: "brake-spring",
          order: 1,
          translations: [
            { locale: "TR", name: "Fren Yayı" },
            { locale: "EN", name: "Brake Spring" },
            { locale: "RU", name: "Тормозная пружина" },
            { locale: "AR", name: "نابض الفرامل" },
          ],
        },
        {
          code: "BD-SHO",
          slug: "brake-shoes",
          order: 2,
          translations: [
            { locale: "TR", name: "Fren Pabucu" },
            { locale: "EN", name: "Brake Shoes" },
            { locale: "RU", name: "Тормозные колодки" },
            { locale: "AR", name: "أحذية الفرامل" },
          ],
        },
        {
          code: "BD-LIN",
          slug: "brake-linings",
          order: 3,
          translations: [
            { locale: "TR", name: "Fren Balatası" },
            { locale: "EN", name: "Brake Linings" },
            { locale: "RU", name: "Тормозные накладки" },
            { locale: "AR", name: "بطانات الفرامل" },
          ],
        },
        {
          code: "BD-SPI",
          slug: "brake-spider",
          order: 4,
          translations: [
            { locale: "TR", name: "Fren Örümceği" },
            { locale: "EN", name: "Brake Spider" },
            { locale: "RU", name: "Тормозной паук" },
            { locale: "AR", name: "عنكبوت الفرامل" },
          ],
        },
      ],
    },
  ];

  for (const cat of categorySeeds) {
    const parent = await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        code: cat.code,
        slug: cat.slug,
        order: cat.order,
        isActive: true,
        translations: { create: cat.translations },
      },
    });
    console.log(`✓ Kategori: ${cat.code} (${cat.slug})`);

    for (const child of cat.children ?? []) {
      await prisma.category.upsert({
        where: { code: child.code },
        update: {},
        create: {
          code: child.code,
          slug: child.slug,
          order: child.order,
          parentId: parent.id,
          isActive: true,
          translations: { create: child.translations },
        },
      });
      console.log(`  └─ ${child.code} (${child.slug})`);
    }
  }

  // --------------------------------------------------------------------------
  // PRODUCTS — örnek MNV-XX-NNNN ürünler
  // --------------------------------------------------------------------------
  type ProductSeed = {
    sku: string;
    slug: string;
    categoryCode: string;
    material: string;
    partType: PartType;
    isFeatured?: boolean;
    translations: {
      locale: Locale;
      name: string;
      description: string;
      shortDesc?: string;
    }[];
    specs: { key: string; value: string; unit?: string; order: number }[];
    oemReferences: { oemNumber: string; manufacturer: string }[];
  };

  const productSeeds: ProductSeed[] = [
    {
      sku: "MNV-BD-0001",
      slug: "brake-spring-120mm",
      categoryCode: "BD-SPR",
      material: "Spring Steel",
      partType: "AFTERMARKET",
      isFeatured: true,
      translations: [
        {
          locale: "TR",
          name: "Fren Yayı 120mm",
          description:
            "Ağır vasıta fren sistemleri için yüksek dayanımlı yay çeliği. Standart aks tipleri ile uyumlu.",
          shortDesc: "120mm yüksek dayanımlı fren yayı",
        },
        {
          locale: "EN",
          name: "Brake Spring 120mm",
          description:
            "High-tensile spring steel for heavy vehicle brake systems. Compatible with standard axle types.",
          shortDesc: "120mm high-tensile brake spring",
        },
      ],
      specs: [
        { key: "diameter", value: "120", unit: "mm", order: 1 },
        { key: "wire_thickness", value: "8", unit: "mm", order: 2 },
        { key: "weight", value: "0.85", unit: "kg", order: 3 },
      ],
      oemReferences: [
        { oemNumber: "0004204020", manufacturer: "Mercedes-Benz" },
        { oemNumber: "81434026025", manufacturer: "MAN" },
        { oemNumber: "1075632", manufacturer: "Volvo" },
      ],
    },
    {
      sku: "MNV-BD-0002",
      slug: "brake-shoe-kit-420x180",
      categoryCode: "BD-SHO",
      material: "Cast Iron",
      partType: "AFTERMARKET",
      isFeatured: true,
      translations: [
        {
          locale: "TR",
          name: "Fren Pabuç Takımı 420x180",
          description:
            "Yüksek aşınma direnci için döküm demir gövde. Yedek balata ile birlikte gelir.",
          shortDesc: "420x180mm fren pabuç takımı",
        },
        {
          locale: "EN",
          name: "Brake Shoe Kit 420x180",
          description:
            "Cast iron body for high wear resistance. Includes replacement linings.",
          shortDesc: "420x180mm brake shoe kit",
        },
      ],
      specs: [
        { key: "width", value: "180", unit: "mm", order: 1 },
        { key: "diameter", value: "420", unit: "mm", order: 2 },
        { key: "weight", value: "6.4", unit: "kg", order: 3 },
      ],
      oemReferences: [
        { oemNumber: "II36506F", manufacturer: "BPW" },
        { oemNumber: "MBR5067", manufacturer: "Mercedes-Benz" },
      ],
    },
    {
      sku: "MNV-CK-0001",
      slug: "caliper-repair-kit-knorr",
      categoryCode: "CK",
      material: "Steel + Rubber",
      partType: "OEM",
      translations: [
        {
          locale: "TR",
          name: "Kaliper Tamir Takımı (Knorr SB7)",
          description:
            "Knorr-Bremse SB7 kaliper için komple tamir takımı. Conta, manşon ve pim dahil.",
          shortDesc: "Knorr SB7 kaliper tamir takımı",
        },
        {
          locale: "EN",
          name: "Caliper Repair Kit (Knorr SB7)",
          description:
            "Complete repair kit for Knorr-Bremse SB7 caliper. Includes seals, boots, and pins.",
          shortDesc: "Knorr SB7 caliper repair kit",
        },
      ],
      specs: [
        { key: "compatible_caliper", value: "Knorr SB7", order: 1 },
        { key: "parts_count", value: "14", order: 2 },
      ],
      oemReferences: [
        { oemNumber: "II32480F", manufacturer: "Knorr-Bremse" },
        { oemNumber: "K001916", manufacturer: "Knorr-Bremse" },
      ],
    },
    {
      sku: "MNV-AS-0001",
      slug: "air-suspension-bellow-4882np02",
      categoryCode: "AS",
      material: "Reinforced Rubber",
      partType: "OEM",
      isFeatured: true,
      translations: [
        {
          locale: "TR",
          name: "Hava Süspansiyon Körüğü 4882N",
          description:
            "Treyler aksları için takviyeli kauçuk hava körüğü. Yüksek basınç dayanımı.",
          shortDesc: "Treyler hava süspansiyon körüğü",
        },
        {
          locale: "EN",
          name: "Air Suspension Bellow 4882N",
          description:
            "Reinforced rubber air bellow for trailer axles. High pressure resistance.",
          shortDesc: "Trailer air suspension bellow",
        },
      ],
      specs: [
        { key: "max_pressure", value: "8.5", unit: "bar", order: 1 },
        { key: "max_height", value: "390", unit: "mm", order: 2 },
        { key: "min_height", value: "95", unit: "mm", order: 3 },
      ],
      oemReferences: [
        { oemNumber: "4882NP02", manufacturer: "Firestone" },
        { oemNumber: "21222337", manufacturer: "Volvo" },
        { oemNumber: "81436106017", manufacturer: "MAN" },
      ],
    },
    {
      sku: "MNV-AW-0001",
      slug: "wheel-hub-bpw-eco-plus",
      categoryCode: "AW",
      material: "Forged Steel",
      partType: "OEM",
      translations: [
        {
          locale: "TR",
          name: "Tekerlek Poyrası (BPW Eco Plus)",
          description:
            "BPW Eco Plus aksları için dövme çelik tekerlek poyrası. Rulman önceden takılı.",
          shortDesc: "BPW Eco Plus uyumlu poyra",
        },
        {
          locale: "EN",
          name: "Wheel Hub (BPW Eco Plus)",
          description:
            "Forged steel wheel hub for BPW Eco Plus axles. Bearings pre-installed.",
          shortDesc: "BPW Eco Plus compatible hub",
        },
      ],
      specs: [
        { key: "compatible_axle", value: "BPW Eco Plus", order: 1 },
        { key: "weight", value: "32", unit: "kg", order: 2 },
        { key: "stud_count", value: "10", order: 3 },
      ],
      oemReferences: [
        { oemNumber: "0327226130", manufacturer: "BPW" },
        { oemNumber: "0327226140", manufacturer: "BPW" },
      ],
    },
  ];

  for (const p of productSeeds) {
    const category = await prisma.category.findUnique({
      where: { code: p.categoryCode },
    });
    if (!category) throw new Error(`Kategori bulunamadı: ${p.categoryCode}`);

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        slug: p.slug,
        material: p.material,
        partType: p.partType,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
        categoryId: category.id,
        brandId: moniva.id,
        translations: { create: p.translations },
        specs: { create: p.specs },
        oemReferences: {
          create: p.oemReferences.map((o) => ({
            ...o,
            oemNumberNormalized: normalizeOem(o.oemNumber),
          })),
        },
      },
    });
    console.log(`✓ Ürün: ${p.sku} → ${p.slug}`);
  }

  // --------------------------------------------------------------------------
  // DATASHEETS — public/datasheets/ altındaki demo PDF'ler
  // --------------------------------------------------------------------------
  const datasheetSeeds: {
    sku: string;
    locale: Locale;
    file: string;
    size: number;
  }[] = [
    { sku: "MNV-AS-0001", locale: "EN", file: "mnv-as-0001-en.pdf", size: 626 },
    { sku: "MNV-AS-0001", locale: "TR", file: "mnv-as-0001-tr.pdf", size: 627 },
    { sku: "MNV-BD-0001", locale: "EN", file: "mnv-bd-0001-en.pdf", size: 626 },
  ];

  for (const d of datasheetSeeds) {
    const product = await prisma.product.findUnique({
      where: { sku: d.sku },
      select: { id: true },
    });
    if (!product) continue;
    await prisma.datasheet.upsert({
      where: { productId_locale: { productId: product.id, locale: d.locale } },
      update: { fileUrl: `/datasheets/${d.file}`, fileName: d.file, fileSize: d.size },
      create: {
        productId: product.id,
        locale: d.locale,
        fileUrl: `/datasheets/${d.file}`,
        fileName: d.file,
        fileSize: d.size,
      },
    });
    console.log(`✓ Datasheet: ${d.sku} (${d.locale})`);
  }

  console.log("\n✅ Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
