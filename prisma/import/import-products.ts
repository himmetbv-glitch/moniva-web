/**
 * Ürünleri girer (idempotent). YEREL DB. Vercel/Neon'a DOKUNMAZ.
 * Çalıştır: npx tsx prisma/import/import-products.ts
 *
 * - Kategori: mevcut kategoriler veya "Kategorisiz" kovası (ensure-categories).
 * - SKU: MNV-{skuCode}-{sıra}; sıra mevcut SKU'lardan tohumlanır.
 * - Idempotent: (skuCode + normalize kod) daha önce girildiyse atlar.
 */
import { prisma } from "../../src/lib/prisma";
import { normalizeOem } from "../../src/lib/products/normalize-oem";
import { parseRows } from "./parse-xlsx";
import { ensureCategories } from "./ensure-categories";
import { BRAND_ID } from "./moniva-import.config";
import { makeUnique, slugify } from "./util";

function parseSku(sku: string): { code: string; seq: number } | null {
  const m = sku.match(/^MNV-(.+)-(\d+)$/);
  return m ? { code: m[1], seq: Number(m[2]) } : null;
}

async function main() {
  const { rows } = parseRows();
  const catMap = await ensureCategories();

  // Mevcut ürünler: SKU sayaç tohumu + idempotency anahtarı + slug havuzu
  const existing = await prisma.product.findMany({
    select: {
      sku: true,
      slug: true,
      oemReferences: { where: { manufacturer: "MNV" }, select: { oemNumber: true } },
    },
  });
  const skuSeq = new Map<string, number>();
  const importedKeys = new Set<string>();
  const usedSlugs = new Set<string>();
  for (const p of existing) {
    usedSlugs.add(p.slug);
    const parsed = parseSku(p.sku);
    if (!parsed) continue;
    skuSeq.set(parsed.code, Math.max(skuSeq.get(parsed.code) ?? 0, parsed.seq));
    for (const o of p.oemReferences) {
      importedKeys.add(`${parsed.code}::${normalizeOem(o.oemNumber)}`);
    }
  }
  const uniq = makeUnique(usedSlugs);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { code: string; error: string }[] = [];

  for (const r of rows) {
    const key = `${r.skuCode}::${normalizeOem(r.originalCode)}`;
    if (importedKeys.has(key)) {
      skipped++;
      continue;
    }
    const categoryId = catMap.get(r.categoryCode);
    if (!categoryId) {
      failed++;
      errors.push({ code: r.originalCode, error: `kategori bulunamadı: ${r.categoryCode}` });
      continue;
    }

    const seq = (skuSeq.get(r.skuCode) ?? 0) + 1;
    skuSeq.set(r.skuCode, seq);
    const sku = `MNV-${r.skuCode}-${String(seq).padStart(4, "0")}`;
    const slug = uniq(slugify(`${r.nameStem} ${r.originalCode}`));

    const tech = r.specs.filter((s) => s.key !== "Stok Kodu");
    const specSentence = tech
      .map((s) => `${s.key}: ${s.value}${s.unit ? " " + s.unit : ""}`)
      .join(", ");
    const shortDesc = tech.length
      ? `${r.nameStem}. ${tech
          .slice(0, 2)
          .map((s) => `${s.key} ${s.value}${s.unit ? " " + s.unit : ""}`)
          .join(", ")}.`
      : `${r.nameStem}.`;
    const description = `${r.nameStem}. ${specSentence ? specSentence + ". " : ""}Stok kodu: ${r.originalCode}.`;

    try {
      await prisma.product.create({
        data: {
          sku,
          slug,
          partType: "OEM",
          isActive: true,
          isFeatured: false,
          categoryId,
          brandId: BRAND_ID,
          translations: {
            create: [{ locale: "TR", name: r.name, shortDesc, description }],
          },
          specs: {
            create: r.specs.map((s) => ({
              key: s.key,
              value: s.value,
              unit: s.unit,
              order: s.order,
            })),
          },
          oemReferences: {
            create: r.oem.map((o) => ({
              oemNumber: o.oemNumber,
              oemNumberNormalized: normalizeOem(o.oemNumber),
              manufacturer: o.manufacturer,
            })),
          },
        },
      });
      importedKeys.add(key);
      created++;
      if (created % 200 === 0) console.log(`  ...${created} ürün girildi`);
    } catch (e) {
      failed++;
      errors.push({ code: r.originalCode, error: String((e as Error).message ?? e).slice(0, 140) });
    }
  }

  console.log(`\nBİTTİ → girilen: ${created}, atlanan (zaten var): ${skipped}, hata: ${failed}`);
  if (errors.length) {
    console.log("İlk hatalar:");
    errors.slice(0, 15).forEach((e) => console.log(`  ${e.code}: ${e.error}`));
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
