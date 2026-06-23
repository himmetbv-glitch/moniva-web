"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";

import {
  TEMPLATE_HEADERS,
  TEMPLATE_EXAMPLE,
  validateRow,
  type RawRow,
  type ImportLookupMaps,
} from "@/lib/admin/product-import";
import {
  importProducts,
  type ImportMode,
  type ImportResult,
} from "@/lib/actions/admin-import";

type Step = "upload" | "preview" | "result";

function normalizeRow(r: Record<string, unknown>): RawRow {
  const out: RawRow = {};
  for (const [k, v] of Object.entries(r)) {
    out[k.trim()] = v == null ? "" : String(v);
  }
  return out;
}

export function ProductImport({
  lookups,
  categoryLabels,
}: {
  lookups: ImportLookupMaps;
  categoryLabels: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mode, setMode] = useState<ImportMode>("skip");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validated = rows.map((r) => validateRow(r, lookups));
  const validCount = validated.filter((v) => v.ok).length;
  const invalidCount = rows.length - validCount;

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE], {
      header: [...TEMPLATE_HEADERS],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Urunler");
    XLSX.writeFile(wb, "moniva-urun-sablonu.xlsx");
  };

  const onFile = async (file: File) => {
    setParseError(null);
    try {
      const isCsv = /\.csv$/i.test(file.name);
      // CSV: metni UTF-8 olarak oku (xlsx aksi halde Türkçe karakterleri bozar).
      const wb = isCsv
        ? XLSX.read(await file.text(), { type: "string" })
        : XLSX.read(await file.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
        raw: false,
      });
      if (json.length === 0) {
        setParseError("Dosyada satır bulunamadı.");
        return;
      }
      setRows(json.map(normalizeRow));
      setFileName(file.name);
      setStep("preview");
    } catch {
      setParseError("Dosya okunamadı. .xlsx veya .csv olduğundan emin olun.");
    }
  };

  const runImport = () => {
    startTransition(async () => {
      const res = await importProducts(rows, mode);
      setResult(res);
      setStep("result");
      router.refresh();
    });
  };

  const downloadErrors = () => {
    if (!result) return;
    const lines = [
      "satir,sku,hata",
      ...result.errors.map(
        (e) => `${e.row},"${e.sku}","${e.message.replace(/"/g, '""')}"`,
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-hatalari.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep("upload");
    setRows([]);
    setResult(null);
    setFileName("");
    setParseError(null);
  };

  return (
    <div className="mv-page">
      <div className="iq-head">
        <div>
          <div className="iq-head__crumb">
            <Link href="/admin/products">ÜRÜNLER</Link> / TOPLU IMPORT
          </div>
          <div className="iq-head__title">
            <span>Toplu Ürün İçe Aktar</span>
          </div>
          <div className="iq-head__meta">
            <span>Excel (.xlsx) veya CSV ile binlerce ürünü tek seferde yükleyin.</span>
          </div>
        </div>
        <div className="iq-head__actions">
          <button className="mv-btn mv-btn--ghost" onClick={downloadTemplate}>
            ⬇ Şablon indir (.xlsx)
          </button>
        </div>
      </div>

      {/* Adım göstergesi */}
      <div className="im-steps">
        {[
          ["1", "Dosya yükle", "upload"],
          ["2", "Önizle & doğrula", "preview"],
          ["3", "Sonuç", "result"],
        ].map(([n, label, key]) => (
          <div
            key={key}
            className={
              "im-step" +
              (step === key ? " im-step--on" : "") +
              ((step === "preview" && key === "upload") ||
              (step === "result" && key !== "result")
                ? " im-step--done"
                : "")
            }
          >
            <span className="im-step__n">{n}</span>
            {label}
          </div>
        ))}
      </div>

      {/* ── ADIM 1: YÜKLE ── */}
      {step === "upload" && (
        <div className="mv-card iq-pad">
          <div className="im-drop" onClick={() => inputRef.current?.click()}>
            <div className="im-drop__icon">⬆</div>
            <div className="im-drop__title">Dosyayı seçmek için tıklayın</div>
            <div className="im-drop__sub">.xlsx veya .csv · ilk satır başlık olmalı</div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </div>
          {parseError && <div className="pe-error im-mt">{parseError}</div>}
          <div className="im-help">
            <b>Şablon kolonları:</b> {TEMPLATE_HEADERS.join(", ")}.{" "}
            <b>Kategori</b> mevcut bir kategorinin adı ya da slug{"'"}ı olmalı (
            {categoryLabels.slice(0, 4).join(", ")}
            {categoryLabels.length > 4 ? "…" : ""}). <b>oem</b> ve <b>specs</b>{" "}
            biçimi: <code>Ad=Değer; Ad2=Değer2</code>.
          </div>
        </div>
      )}

      {/* ── ADIM 2: ÖNİZLE ── */}
      {step === "preview" && (
        <>
          <div className="im-summary">
            <div className="im-summary__cell">
              <div className="iq-summary__k">Toplam satır</div>
              <div className="iq-summary__v">{rows.length}</div>
            </div>
            <div className="im-summary__cell">
              <div className="iq-summary__k">Geçerli</div>
              <div className="iq-summary__v im-ok">{validCount}</div>
            </div>
            <div className="im-summary__cell">
              <div className="iq-summary__k">Hatalı</div>
              <div className="iq-summary__v im-err">{invalidCount}</div>
            </div>
            <div className="im-summary__cell im-summary__cell--file">
              <div className="iq-summary__k">Dosya</div>
              <div className="im-file">{fileName}</div>
            </div>
          </div>

          <div className="mv-card mv-card--flush">
            <div className="mv-card__head">
              <div className="iq-cardhead__ttl">Önizleme (ilk 10 satır)</div>
              <span className="mv-card__link" onClick={reset} style={{ cursor: "pointer" }}>
                Başka dosya seç
              </span>
            </div>
            <table className="mv-table">
              <thead>
                <tr>
                  <th>Durum</th>
                  <th>SKU</th>
                  <th>Ad (TR/EN)</th>
                  <th>Kategori</th>
                  <th>Sorun</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => {
                  const v = validated[i];
                  return (
                    <tr key={i}>
                      <td>
                        <span className={"mv-pill mv-pill--" + (v.ok ? "ok" : "err")}>
                          {v.ok ? "Geçerli" : "Hata"}
                        </span>
                      </td>
                      <td>
                        <span className="mv-mono mv-ref">{r.sku || "—"}</span>
                      </td>
                      <td>{r.name_tr || r.name_en || "—"}</td>
                      <td className="mv-muted">{r.category || "—"}</td>
                      <td className="mv-dim">{v.ok ? "—" : v.errors.join("; ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mv-card iq-pad im-mt">
            <div className="iq-cardhead__ttl">İçe aktarma seçeneği</div>
            <div className="im-modes">
              <label className={"im-mode" + (mode === "skip" ? " im-mode--on" : "")}>
                <input type="radio" name="mode" checked={mode === "skip"} onChange={() => setMode("skip")} />
                <div>
                  <b>Yeni ekle, varsa atla</b>
                  <span>Aynı SKU varsa dokunma; yalnızca yeni ürünleri ekle.</span>
                </div>
              </label>
              <label className={"im-mode" + (mode === "update" ? " im-mode--on" : "")}>
                <input type="radio" name="mode" checked={mode === "update"} onChange={() => setMode("update")} />
                <div>
                  <b>Varsa güncelle</b>
                  <span>Aynı SKU varsa üzerine yaz; yoksa yeni ekle.</span>
                </div>
              </label>
            </div>
            <div className="im-actions">
              <span className="im-note">
                {invalidCount > 0
                  ? `${invalidCount} hatalı satır atlanacak, ${validCount} satır işlenecek.`
                  : `${validCount} satır işlenecek.`}
              </span>
              <button
                className="mv-btn mv-btn--primary"
                onClick={runImport}
                disabled={pending || validCount === 0}
              >
                {pending ? "İçe aktarılıyor…" : "İçe aktar"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── ADIM 3: SONUÇ ── */}
      {step === "result" && result && (
        <>
          <div className="im-summary">
            <div className="im-summary__cell">
              <div className="iq-summary__k">Eklendi</div>
              <div className="iq-summary__v im-ok">{result.created}</div>
            </div>
            <div className="im-summary__cell">
              <div className="iq-summary__k">Güncellendi</div>
              <div className="iq-summary__v">{result.updated}</div>
            </div>
            <div className="im-summary__cell">
              <div className="iq-summary__k">Atlandı</div>
              <div className="iq-summary__v">{result.skipped}</div>
            </div>
            <div className="im-summary__cell">
              <div className="iq-summary__k">Hatalı</div>
              <div className="iq-summary__v im-err">{result.failed}</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mv-card mv-card--flush im-mt">
              <div className="mv-card__head">
                <div className="iq-cardhead__ttl">Hatalı satırlar ({result.errors.length})</div>
                <span className="mv-card__link" onClick={downloadErrors} style={{ cursor: "pointer" }}>
                  ⬇ Hata logunu indir
                </span>
              </div>
              <table className="mv-table">
                <thead>
                  <tr>
                    <th>Satır</th>
                    <th>SKU</th>
                    <th>Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.slice(0, 50).map((e, i) => (
                    <tr key={i}>
                      <td className="mv-num">{e.row}</td>
                      <td>
                        <span className="mv-mono mv-ref">{e.sku || "—"}</span>
                      </td>
                      <td className="mv-dim">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="im-actions im-mt">
            <button className="mv-btn mv-btn--ghost" onClick={reset}>
              Yeni import
            </button>
            <Link href="/admin/products" className="mv-btn mv-btn--primary">
              Ürünlere git ▶
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
