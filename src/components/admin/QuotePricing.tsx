"use client";

import { useMemo, useState, useTransition } from "react";

import { saveQuotePricing } from "@/lib/actions/admin-inquiry";
import {
  computeQuoteTotals,
  formatMoney,
  SHIPPING_MODES,
  type Currency,
} from "@/lib/admin/quote-pricing";

type Item = {
  id: string;
  sku: string;
  name: string;
  oem: string | null;
  quantity: number;
  unitPrice: number | null;
};

type RowState = { id: string; sku: string; name: string; oem: string | null; qty: string; unit: string };

export function QuotePricing({
  requestId,
  currency,
  isQuoted,
  initialItems,
  initial,
  pdfHref,
}: {
  requestId: string;
  currency: Currency;
  isQuoted: boolean;
  initialItems: Item[];
  initial: {
    discountPct: number;
    shippingCost: number;
    shippingMode: string | null;
    vatRate: number;
    validUntil: string | null;
    paymentTerms: string | null;
  };
  pdfHref: string;
}) {
  const [rows, setRows] = useState<RowState[]>(
    initialItems.map((it) => ({
      id: it.id,
      sku: it.sku,
      name: it.name,
      oem: it.oem,
      qty: String(it.quantity),
      unit: it.unitPrice == null ? "" : String(it.unitPrice),
    })),
  );
  const [discountPct, setDiscountPct] = useState(String(initial.discountPct ?? 0));
  const [shippingCost, setShippingCost] = useState(String(initial.shippingCost ?? 0));
  const [shippingMode, setShippingMode] = useState(initial.shippingMode ?? "");
  const [vatRate, setVatRate] = useState(String(initial.vatRate ?? 0));
  const [validUntil, setValidUntil] = useState(initial.validUntil ?? "");
  const [paymentTerms, setPaymentTerms] = useState(initial.paymentTerms ?? "");

  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const num = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const totals = useMemo(
    () =>
      computeQuoteTotals(
        rows.map((r) => ({ quantity: num(r.qty), unitPrice: num(r.unit) })),
        { discountPct: num(discountPct), shippingCost: num(shippingCost), vatRate: num(vatRate) },
      ),
    [rows, discountPct, shippingCost, vatRate],
  );

  const totalQty = rows.reduce((s, r) => s + num(r.qty), 0);
  const allPriced = rows.every((r) => num(r.unit) > 0);

  const setRow = (id: string, key: "qty" | "unit", value: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  function persist(markQuoted: boolean) {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveQuotePricing({
        id: requestId,
        items: rows.map((r) => ({
          id: r.id,
          quantity: Math.max(1, Math.round(num(r.qty))),
          unitPrice: r.unit.trim() === "" ? null : num(r.unit),
        })),
        discountPct: num(discountPct),
        shippingCost: num(shippingCost),
        shippingMode: shippingMode.trim() || null,
        vatRate: num(vatRate),
        validUntil: validUntil || null,
        paymentTerms: paymentTerms.trim() || null,
        markQuoted,
      });
      if (res.ok) {
        setFeedback({
          kind: "ok",
          msg: markQuoted ? "Teklif gönderildi — durum QUOTED." : "Fiyatlandırma kaydedildi.",
        });
      } else {
        setFeedback({ kind: "err", msg: res.error });
      }
    });
  }

  return (
    <div className="ad-card ad-card--flush">
      <div className="ad-card__head">
        <div>
          <div className="iq-cardhead__ttl">Talep edilen parçalar &amp; fiyatlandırma</div>
          <div className="ad-card__sub">
            {rows.length} kalem · {totalQty} adet · birim fiyatlar düzenlenebilir
          </div>
        </div>
        <div className="qp-headactions">
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className={"ad-btn ad-btn--ghost" + (allPriced ? "" : " ad-btn--disabled")}
            aria-disabled={!allPriced}
            onClick={(e) => {
              if (!allPriced) e.preventDefault();
            }}
          >
            PDF indir
          </a>
        </div>
      </div>

      <table className="ad-table qp-table">
        <thead>
          <tr>
            <th>Parça (SKU)</th>
            <th>Açıklama / OEM</th>
            <th className="ad-num">Adet</th>
            <th className="ad-num">Birim ({currency})</th>
            <th className="ad-num">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <span className="ad-mono ad-ref">{r.sku}</span>
              </td>
              <td>
                <div className="qp-name">{r.name}</div>
                {r.oem && <div className="qp-oem ad-mono">{r.oem}</div>}
              </td>
              <td className="ad-num">
                <input
                  className="qp-input qp-input--qty"
                  inputMode="numeric"
                  value={r.qty}
                  onChange={(e) => setRow(r.id, "qty", e.target.value)}
                />
              </td>
              <td className="ad-num">
                <input
                  className="qp-input qp-input--unit"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={r.unit}
                  onChange={(e) => setRow(r.id, "unit", e.target.value)}
                />
              </td>
              <td className="ad-num qp-line">
                {formatMoney(num(r.qty) * num(r.unit), currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ayarlar + Toplamlar */}
      <div className="qp-foot">
        <div className="qp-settings">
          <div className="qp-settings__ttl">Teklif ayarları</div>
          <label className="qp-field">
            <span>İskonto %</span>
            <input
              className="qp-input"
              inputMode="decimal"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
            />
          </label>
          <label className="qp-field">
            <span>Navlun ({currency})</span>
            <input
              className="qp-input"
              inputMode="decimal"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
            />
          </label>
          <label className="qp-field">
            <span>Teslim şekli</span>
            <select
              className="qp-select"
              value={shippingMode}
              onChange={(e) => setShippingMode(e.target.value)}
            >
              <option value="">—</option>
              {SHIPPING_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="qp-field">
            <span>KDV %</span>
            <input
              className="qp-input"
              inputMode="decimal"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
            />
          </label>
          <label className="qp-field">
            <span>Geçerlilik</span>
            <input
              className="qp-input qp-input--date"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </label>
          <label className="qp-field">
            <span>Ödeme vadesi</span>
            <input
              className="qp-input qp-input--text"
              placeholder="Örn. Net 60"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </label>
        </div>

        <div className="qp-totals">
          <div className="qp-trow">
            <span>Ara toplam</span>
            <span>{formatMoney(totals.subtotal, currency)}</span>
          </div>
          <div className="qp-trow qp-trow--neg">
            <span>İskonto ({num(discountPct)}%)</span>
            <span>− {formatMoney(totals.discountAmount, currency)}</span>
          </div>
          <div className="qp-trow">
            <span>Navlun</span>
            <span>{formatMoney(totals.shippingCost, currency)}</span>
          </div>
          <div className="qp-trow">
            <span>KDV ({num(vatRate)}%)</span>
            <span>{formatMoney(totals.vatAmount, currency)}</span>
          </div>
          <div className="qp-trow qp-trow--grand">
            <span>Genel toplam</span>
            <span>{formatMoney(totals.total, currency)}</span>
          </div>
        </div>
      </div>

      <div className="qp-actions">
        {feedback && (
          <span className={"qp-feedback qp-feedback--" + feedback.kind}>{feedback.msg}</span>
        )}
        <button
          type="button"
          className="ad-btn ad-btn--ghost"
          disabled={pending}
          onClick={() => persist(false)}
        >
          {pending ? "Kaydediliyor…" : "Taslağı kaydet"}
        </button>
        <button
          type="button"
          className="ad-btn ad-btn--primary"
          disabled={pending || !allPriced}
          title={allPriced ? undefined : "Tüm kalemlere birim fiyat girin"}
          onClick={() => persist(true)}
        >
          {isQuoted ? "Teklifi güncelle ▶" : "Teklif gönder ▶"}
        </button>
      </div>
    </div>
  );
}
