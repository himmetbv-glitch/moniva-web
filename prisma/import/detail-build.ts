/**
 * Detay Excel'i okuma + Türkçe özellik üretimi (saf; DB yok).
 * detail-apply-one.ts (tek) ve detail-import-all.ts (batch) bunu paylaşır.
 * Karar: SADECE teknik özellikler (ad/kategori dokunma) + ACIKLAMA → "Uygulama" özelliği.
 */
import * as XLSX from "xlsx";

import { normalizeOem } from "../../src/lib/products/normalize-oem";
import {
  COLUMN_TR,
  DETAIL_EMPTY,
  DETAIL_XLSX_PATH,
  SKIP_COLUMNS,
  trValue,
} from "./detail-import.config";

export type Spec = { key: string; value: string; order: number };
export type DetailEntry = { row: Record<string, unknown>; cols: string[]; sheet: string };

export function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
export function isEmpty(v: string): boolean {
  return v === "" || DETAIL_EMPTY.has(v.toLowerCase());
}

/** normOem → detay satırı (ilk görülen kazanır). */
export function loadDetail(): Map<string, DetailEntry> {
  const wb = XLSX.readFile(DETAIL_XLSX_PATH);
  const map = new Map<string, DetailEntry>();
  for (const sn of wb.SheetNames) {
    if (sn === "TUM URUNLER") continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: null }) as Record<string, unknown>[];
    const cols = rows.length ? Object.keys(rows[0]) : [];
    for (const r of rows) {
      const sc = cell(r["STOCK CODE"]);
      if (!sc || sc === "-") continue;
      const key = normalizeOem(sc);
      if (!map.has(key)) map.set(key, { row: r, cols, sheet: sn });
    }
  }
  return map;
}

/** Detay satırından Türkçe özellik listesi (Stok Kodu → Uygulama → teknik kolonlar). */
export function buildSpecs(code: string, entry: DetailEntry): Spec[] {
  const { row, cols } = entry;
  const specs: Spec[] = [{ key: "Stok Kodu", value: code, order: 0 }];
  let order = 1;

  // ACIKLAMA → "Uygulama" (dolu ise)
  const aciklama = cell(row["ACIKLAMA"]);
  if (!isEmpty(aciklama)) {
    specs.push({ key: "Uygulama", value: trValue(aciklama), order: order++ });
  }

  for (const col of cols) {
    if (col === "STOCK CODE" || SKIP_COLUMNS.has(col)) continue;
    const label = COLUMN_TR[col];
    if (!label) continue;
    const raw = cell(row[col]);
    if (isEmpty(raw)) continue;
    specs.push({ key: label, value: trValue(raw), order: order++ });
  }
  return specs;
}
