import { prisma } from "../src/lib/prisma";

// moniva.com.tr/product-99720020021-191 kaynağından alınan ürün → Hava Süspansiyon (AS).
const SKU = "MNV-AS-0002";
const SLUG = "yayli-fren-korugu-99-7200-200-21";
const CATEGORY_ID = "cmpwv2fkl0002rfeb4oxwwuwz"; // AS / Hava Süspansiyon
const BRAND_ID = "cmpwv2fkj0001rfebgtwyc9aq"; // Moniva

// Kategori şema attribute'larına eşlenen teknik özellikler (id, ad, değer).
// OE NUMBER ve OPERATING PRESSURE kaynakta net olmadığı için atlandı.
const SPECS: { attributeId: string; key: string; value: string; order: number }[] = [
  { attributeId: "cmqibxren000brfhv4qprt69u", key: "USE PLACE", value: "VARIOUS VEHICLES", order: 0 },
  { attributeId: "cmqibxreo000drfhvhz5kxxp7", key: "STOCK CODE", value: "99.7200.200.21", order: 1 },
  { attributeId: "cmqoaao2o000krf1maejqkte0", key: "TYPE", value: "16/24", order: 3 },
  { attributeId: "cmqoaao2p000mrf1mqzhzer0x", key: "STROKE", value: "64/64", order: 4 },
  { attributeId: "cmqoaao2p000orf1maqc9t4j0", key: "FLANGE LENGTH", value: "240", order: 5 },
  { attributeId: "cmqoaao2p000qrf1myzkmwk32", key: "TYPE OF PULLER", value: "H", order: 6 },
  { attributeId: "cmqoaao2q000srf1m4eg2xnmb", key: "SHAFT LENGTH", value: "LONG", order: 7 },
  { attributeId: "cmqoaao2q000urf1mz43jetzy", key: "CENTER", value: "120.7", order: 8 },
  { attributeId: "cmqoaao2q000wrf1mm2dwfxzl", key: "SCREW", value: "M16x1.5", order: 9 },
  { attributeId: "cmqoaao2r000yrf1mwbxalf43", key: "SCREW LENGTH", value: "37.0", order: 10 },
  { attributeId: "cmqoaao2r0010rf1m0bor4rd0", key: "TOP BOWL", value: "45", order: 11 },
  { attributeId: "cmqoaao2r0012rf1mr11h9qfm", key: "AIR INTAKE", value: "M16x1.5", order: 12 },
  { attributeId: "cmqoaao2r0014rf1m3q6z157r", key: "KG", value: "8.4", order: 13 },
];

async function main() {
  const exists = await prisma.product.findFirst({
    where: { OR: [{ sku: SKU }, { slug: SLUG }] },
    select: { id: true, sku: true },
  });
  if (exists) {
    console.log(`Zaten var (${exists.sku}) — atlandı. Tekrar girmek için önce silin.`);
    return;
  }

  const p = await prisma.product.create({
    data: {
      sku: SKU,
      slug: SLUG,
      partType: "OEM",
      material: "Steel",
      isActive: true,
      isFeatured: false,
      categoryId: CATEGORY_ID,
      brandId: BRAND_ID,
      translations: {
        create: [
          {
            locale: "TR",
            name: "Yaylı Fren Körüğü 99.7200.200.21",
            shortDesc: "Çeşitli araçlar için yaylı fren körüğü (spring brake chamber).",
            description:
              "Çeşitli ağır vasıta ve treyler uygulamaları için yaylı fren körüğü (spring brake chamber). Tip 16/24, strok 64/64, flanş uzunluğu 240. Ağırlık 8,4 kg.",
          },
        ],
      },
      specs: {
        create: SPECS.map((s) => ({
          attributeId: s.attributeId,
          key: s.key,
          value: s.value,
          unit: null,
          order: s.order,
        })),
      },
      oemReferences: {
        create: [
          {
            oemNumber: "99.7200.200.21",
            oemNumberNormalized: "99720020021",
            manufacturer: "MNV",
          },
        ],
      },
    },
    select: { id: true, sku: true, slug: true },
  });

  console.log(
    `OK — ürün girildi: ${p.sku} (slug: ${p.slug})\n` +
      `  Detay: /urunler/${p.slug}\n` +
      `  ${SPECS.length} teknik özellik, 1 OEM referansı (99.7200.200.21 / MNV)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
