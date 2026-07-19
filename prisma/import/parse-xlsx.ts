/**
 * xlsx'i okur, dönüştürür, tekilleştirir → temiz ürün satırları (CleanRow[]).
 * Saf: hiçbir DB işlemi yok. ensure-categories + import-products bunu kullanır.
 */
import * as XLSX from "xlsx";

import { normalizeOem } from "../../src/lib/products/normalize-oem";
import {
  DIRECTION_MAP,
  EMPTY_VALUES,
  FAMILY_MAP,
  SHEET_NAME,
  SPEC_COLUMNS,
  XLSX_PATH,
} from "./moniva-import.config";

export type CleanSpec = { key: string; value: string; unit: string | null; order: number };
export type CleanOem = { oemNumber: string; manufacturer: string | null };

export type CleanRow = {
  rowNo: number;
  originalCode: string;
  categoryCode: string; // hedef kategori kodu (mevcut veya UNCAT)
  skuCode: string; // SKU aile kodu (kategoriden bağımsız)
  nameStem: string;
  name: string;
  specs: CleanSpec[];
  oem: CleanOem[];
};

export type ParseResult = {
  rows: CleanRow[];
  unmapped: { rowNo: number; main: string; sub: string; code: string }[];
  droppedDupes: { rowNo: number; code: string; skuCode: string }[];
  totalXlsxRows: number;
};

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  return String(v).trim();
}

function isEmpty(v: string): boolean {
  return v === "" || EMPTY_VALUES.has(v.toLowerCase());
}

// LINING NUMBER "433020 - 5913" → ["433020","5913"]; "44562" → ["44562"].
function liningTokens(raw: string): string[] {
  return raw
    .split(/\s*[-/]\s*/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !isEmpty(t));
}

export function parseRows(): ParseResult {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) throw new Error(`Sheet bulunamadı: ${SHEET_NAME}`);
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: null });

  const rows: CleanRow[] = [];
  const unmapped: ParseResult["unmapped"] = [];
  const droppedDupes: ParseResult["droppedDupes"] = [];
  const seen = new Set<string>(); // `${skuCode}::${normOem(code)}` — Sınıf B tekilleştirme

  for (const r of raw) {
    const rowNo = Number(r["No"] ?? 0);
    const main = cellStr(r["Main Category"]);
    const sub = cellStr(r["Sub Category"]);
    const code = cellStr(r["Product Code"]);
    if (!code) continue; // kod yoksa atla

    const fam = FAMILY_MAP[`${main}::${sub}`];
    if (!fam) {
      unmapped.push({ rowNo, main, sub, code });
      continue;
    }

    // Sınıf B tekilleştirme: aynı aile + aynı normalize kod → tek ürün.
    const dedupKey = `${fam.skuCode}::${normalizeOem(code)}`;
    if (seen.has(dedupKey)) {
      droppedDupes.push({ rowNo, code, skuCode: fam.skuCode });
      continue;
    }
    seen.add(dedupKey);

    // --- Özellikler ---
    const specs: CleanSpec[] = [{ key: "Stok Kodu", value: code, unit: null, order: 0 }];
    let order = 1;
    for (const sc of SPEC_COLUMNS) {
      let val = cellStr(r[sc.col]);
      if (isEmpty(val)) continue;
      if (sc.col === "DIRECTION") {
        val = DIRECTION_MAP[val.toUpperCase()] ?? val;
      }
      specs.push({ key: sc.label, value: val, unit: sc.unit, order: order++ });
    }

    // --- OEM referansları ---
    const oemMap = new Map<string, CleanOem>();
    oemMap.set(code, { oemNumber: code, manufacturer: "MNV" });
    const lining = cellStr(r["LINING NUMBER"]);
    if (!isEmpty(lining)) {
      for (const tok of liningTokens(lining)) {
        if (!oemMap.has(tok)) oemMap.set(tok, { oemNumber: tok, manufacturer: "Balata" });
      }
    }

    rows.push({
      rowNo,
      originalCode: code,
      categoryCode: fam.categoryCode,
      skuCode: fam.skuCode,
      nameStem: fam.nameStem,
      name: `${fam.nameStem} ${code}`,
      specs,
      oem: [...oemMap.values()],
    });
  }

  return { rows, unmapped, droppedDupes, totalXlsxRows: raw.length };
}
