/**
 * Ürünlerin SKU'sunu gerçek Moniva stok koduna çevirir.
 *
 * Import sırasında MNV-XXX-NNNN biçiminde yapay SKU üretilmişti; oysa gerçek
 * Moniva kodu (örn. 97.1350.200.51) ürünün "Stok Kodu" teknik özelliğinde
 * zaten duruyor. Bu script o değeri SKU alanına taşır.
 *
 * Güvenlik:
 *  - slug'a DOKUNMAZ → ürün URL'leri ve SEO değişmez.
 *  - Aynı koda sahip birden çok ürün varsa (bilinen 3 kod) İKİSİNİ DE atlar
 *    ve raporlar — SKU benzersiz kalmalı, hangisinin gerçek sahibi olduğuna
 *    insan karar vermeli.
 *  - Kod başka bir ürünün mevcut SKU'suyla çakışıyorsa atlar.
 *  - Eski→yeni eşlemesini /tmp'ye yedekler (geri alma için).
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env \
 *     prisma/import/apply-moniva-stock-codes.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

const isStokKodu = (key: string) => key.toLowerCase().replace(/\s/g, "") === "stokkodu";

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Hedef DB: ${url.includes("localhost") ? "YEREL" : "UZAK (Neon)"}${DRY ? "  [DRY-RUN]" : ""}\n`);

  const prods = await prisma.product.findMany({
    select: { id: true, sku: true, specs: { select: { key: true, value: true } } },
  });

  // productId -> gerçek kod
  const code = new Map<string, string>();
  for (const p of prods) {
    const s = p.specs.find((x) => isStokKodu(x.key));
    const v = s?.value?.trim();
    if (v && v !== "-") code.set(p.id, v);
  }

  // Tekrarlı kodları tespit et (SKU benzersiz olmalı)
  const byCode = new Map<string, string[]>();
  for (const [pid, v] of code) byCode.set(v, [...(byCode.get(v) ?? []), pid]);
  const dups = new Set([...byCode.entries()].filter(([, ids]) => ids.length > 1).map(([v]) => v));

  const skuOwner = new Map(prods.map((p) => [p.sku, p.id]));

  let updated = 0;
  let already = 0;
  let skippedDup = 0;
  let skippedClash = 0;
  const backup: { id: string; oldSku: string; newSku: string }[] = [];

  for (const p of prods) {
    const v = code.get(p.id);
    if (!v) continue;
    if (p.sku === v) {
      already++;
      continue;
    }
    if (dups.has(v)) {
      skippedDup++;
      continue;
    }
    const owner = skuOwner.get(v);
    if (owner && owner !== p.id) {
      skippedClash++;
      continue;
    }
    backup.push({ id: p.id, oldSku: p.sku, newSku: v });
    if (!DRY) await prisma.product.update({ where: { id: p.id }, data: { sku: v } });
    updated++;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = `/tmp/sku-migration-backup-${stamp}.json`;
  writeFileSync(out, JSON.stringify(backup, null, 1));

  console.log(`  gerçek kodu olan ürün : ${code.size}`);
  console.log(`  güncellenen           : ${updated}`);
  console.log(`  zaten doğru           : ${already}`);
  console.log(`  atlanan (tekrarlı kod): ${skippedDup}  ${dups.size ? "→ " + [...dups].join(", ") : ""}`);
  console.log(`  atlanan (SKU çakışma) : ${skippedClash}`);
  console.log(`  yedek                 : ${out}`);
  console.log(`\n  örnek: ${backup.slice(0, 4).map((b) => `${b.oldSku} → ${b.newSku}`).join("\n         ")}`);
  if (DRY) console.log("\n(dry-run — yazma yapılmadı)");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
