/**
 * TÜM ürünlere detay özellik girişi (YEREL). Vercel/Neon'a DOKUNMAZ.
 *   Dry:  npx tsx prisma/import/detail-import-all.ts
 *   Yaz:  npx tsx prisma/import/detail-import-all.ts --write
 *
 * Karar: SADECE teknik özellikler (ad/kategori değişmez). Her eşleşen ürünün
 * özellikleri Excel'deki Türkçe detayla DEĞİŞTİRİLİR (delete + create). Idempotent.
 * Eşleşmeyen ürünler (Excel'de kodu yoksa) OLDUĞU GİBİ bırakılır.
 */
import { prisma } from "../../src/lib/prisma";
import { buildSpecs, loadDetail } from "./detail-build";

async function main() {
  const write = process.argv.includes("--write");
  const detail = loadDetail();

  const mnv = await prisma.oemReference.findMany({
    where: { manufacturer: "MNV" },
    select: { oemNumber: true, oemNumberNormalized: true, productId: true },
  });
  const byNorm = new Map<string, { pid: string; code: string }[]>();
  for (const o of mnv) {
    const a = byNorm.get(o.oemNumberNormalized) ?? [];
    a.push({ pid: o.productId, code: o.oemNumber });
    byNorm.set(o.oemNumberNormalized, a);
  }

  const ops: { pid: string; code: string; entry: ReturnType<typeof loadDetail> extends Map<string, infer E> ? E : never }[] = [];
  let codesMatched = 0;
  let codesUnmatched = 0;
  for (const [norm, entry] of detail) {
    const prods = byNorm.get(norm);
    if (!prods) { codesUnmatched++; continue; }
    codesMatched++;
    for (const pr of prods) ops.push({ pid: pr.pid, code: pr.code, entry });
  }

  console.log(`Excel detay kodu: ${detail.size}`);
  console.log(`  eşleşen: ${codesMatched} | eşleşmeyen (bizde ürün yok): ${codesUnmatched}`);
  console.log(`Güncellenecek ürün işlemi: ${ops.length}`);

  if (!write) {
    console.log("\n(DRY-RUN — yazılmadı. Uygulamak için: --write)");
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const op of ops) {
    const specs = buildSpecs(op.code, op.entry);
    await prisma.$transaction([
      prisma.productSpec.deleteMany({ where: { productId: op.pid } }),
      prisma.productSpec.createMany({
        data: specs.map((s) => ({ productId: op.pid, key: s.key, value: s.value, order: s.order })),
      }),
    ]);
    updated++;
    if (updated % 200 === 0) console.log(`  ...${updated} ürün güncellendi`);
  }
  console.log(`\nBİTTİ → ${updated} ürün güncellendi (detaysız kalan ürünlere dokunulmadı).`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
