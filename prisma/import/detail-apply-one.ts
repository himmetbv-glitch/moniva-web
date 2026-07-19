/**
 * TEK ürüne detay özellik girişi (YEREL). Varsayılan: DRY-RUN (yazmaz).
 *   Dry:   npx tsx prisma/import/detail-apply-one.ts 99.7200.200.21
 *   Yaz:   npx tsx prisma/import/detail-apply-one.ts 99.7200.200.21 --write [SKU]
 * [SKU] verilirse yalnız o ürüne uygular (mükerrer kodlarda seçim için).
 */
import * as XLSX from "xlsx";

import { prisma } from "../../src/lib/prisma";
import { normalizeOem } from "../../src/lib/products/normalize-oem";
import {
  COLUMN_TR,
  DETAIL_EMPTY,
  DETAIL_XLSX_PATH,
  SKIP_COLUMNS,
  trValue,
} from "./detail-import.config";

type Spec = { key: string; value: string; order: number };

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function isEmpty(v: string): boolean {
  return v === "" || DETAIL_EMPTY.has(v.toLowerCase());
}

// Excel → normOem → { row, sheet, order (kolon sırası) }
function loadDetail(): Map<string, { row: Record<string, unknown>; cols: string[]; sheet: string }> {
  const wb = XLSX.readFile(DETAIL_XLSX_PATH);
  const map = new Map<string, { row: Record<string, unknown>; cols: string[]; sheet: string }>();
  for (const sn of wb.SheetNames) {
    if (sn === "TUM URUNLER") continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: null }) as Record<string, unknown>[];
    const cols = rows.length ? Object.keys(rows[0]) : [];
    for (const r of rows) {
      const sc = cell(r["STOCK CODE"]);
      if (!sc) continue;
      const key = normalizeOem(sc);
      if (!map.has(key)) map.set(key, { row: r, cols, sheet: sn });
    }
  }
  return map;
}

// Detay satırından Türkçe özellik listesi üret (kolon sırasını korur; Stok Kodu başa).
function buildSpecs(code: string, row: Record<string, unknown>, cols: string[]): Spec[] {
  const specs: Spec[] = [{ key: "Stok Kodu", value: code, order: 0 }];
  let order = 1;
  for (const col of cols) {
    if (col === "STOCK CODE" || SKIP_COLUMNS.has(col)) continue;
    const label = COLUMN_TR[col];
    if (!label) continue; // haritada yoksa atla (bilinmeyen kolon)
    const raw = cell(row[col]);
    if (isEmpty(raw)) continue;
    specs.push({ key: label, value: trValue(raw), order: order++ });
  }
  return specs;
}

async function main() {
  const code = process.argv[2];
  const write = process.argv.includes("--write");
  const skuArg = process.argv.find((a, i) => i >= 3 && !a.startsWith("--"));
  if (!code) throw new Error("Kullanım: detail-apply-one.ts <STOK_KODU> [--write] [SKU]");

  const detail = loadDetail();
  const norm = normalizeOem(code);
  const d = detail.get(norm);
  if (!d) { console.log(`Excel'de detay satırı YOK: ${code}`); return; }

  const proposed = buildSpecs(code, d.row, d.cols);
  const aciklama = cell(d.row["ACIKLAMA"]);
  const kategori = cell(d.row["KATEGORI"]);

  console.log(`\n=== KAYNAK (Excel sayfa "${d.sheet}") ===`);
  console.log(`KATEGORI: ${kategori}`);
  console.log(`ACIKLAMA: ${aciklama || "-"}`);
  console.log(`\n=== ÖNERİLEN TÜRKÇE ÖZELLİKLER (${proposed.length}) ===`);
  proposed.forEach((s) => console.log(`  ${s.key}: ${s.value}`));

  const oems = await prisma.oemReference.findMany({
    where: { manufacturer: "MNV", oemNumberNormalized: norm },
    select: { productId: true },
  });
  const products = await prisma.product.findMany({
    where: { id: { in: oems.map((o) => o.productId) } },
    select: {
      id: true, sku: true,
      translations: { where: { locale: "TR" }, select: { name: true } },
      specs: { orderBy: { order: "asc" }, select: { key: true, value: true } },
    },
  });

  console.log(`\n=== EŞLEŞEN ÜRÜN(LER): ${products.length} ===`);
  for (const p of products) {
    console.log(`\n[${p.sku}] ${p.translations[0]?.name} — mevcut ${p.specs.length} özellik:`);
    p.specs.forEach((s) => console.log(`   (eski) ${s.key}: ${s.value}`));
  }

  if (!write) {
    console.log(`\n(DRY-RUN — yazılmadı. Uygulamak için: --write [SKU])`);
    await prisma.$disconnect();
    return;
  }

  const targets = skuArg ? products.filter((p) => p.sku === skuArg) : products;
  if (targets.length === 0) { console.log(`\nHedef ürün bulunamadı (SKU: ${skuArg}).`); await prisma.$disconnect(); return; }

  for (const p of targets) {
    await prisma.$transaction([
      prisma.productSpec.deleteMany({ where: { productId: p.id } }),
      prisma.productSpec.createMany({
        data: proposed.map((s) => ({ productId: p.id, key: s.key, value: s.value, order: s.order })),
      }),
    ]);
    console.log(`\n✓ YAZILDI → [${p.sku}] ${proposed.length} özellik güncellendi.`);
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
