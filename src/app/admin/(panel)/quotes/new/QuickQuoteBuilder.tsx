"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  searchProductsForQuote,
  type QuoteProductHit,
} from "@/lib/actions/admin-quote";
import {
  computeQuoteTotals,
  formatMoney,
  SHIPPING_MODES,
  type Currency,
} from "@/lib/admin/quote-pricing";
import { Icons } from "../../icons";

type Item = {
  key: string;
  productId: string;
  sku: string;
  name: string;
  oem: string | null;
  qty: string;
  unit: string;
};

const EMPTY_CUSTOMER = {
  companyName: "",
  fullName: "",
  phone: "",
  email: "",
  country: "Türkiye",
  city: "",
  taxNumber: "",
  taxOffice: "",
  address: "",
};

type CustomerKey = keyof typeof EMPTY_CUSTOMER;

const FIELDS: { k: CustomerKey; label: string; type?: string }[] = [
  { k: "companyName", label: "Firma adı" },
  { k: "fullName", label: "Yetkili kişi" },
  { k: "phone", label: "Telefon" },
  { k: "email", label: "E-posta", type: "email" },
  { k: "country", label: "Ülke" },
  { k: "city", label: "Şehir" },
  { k: "taxNumber", label: "VKN" },
  { k: "taxOffice", label: "Vergi dairesi" },
];

const CURRENCIES: Currency[] = ["TRY", "USD", "EUR"];

const num = (s: string) => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function QuickQuoteBuilder() {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [items, setItems] = useState<Item[]>([]);

  const [currency, setCurrency] = useState<Currency>("TRY");
  const [discountPct, setDiscountPct] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [shippingMode, setShippingMode] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [note, setNote] = useState("");

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<QuoteProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, startSearch] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced product lookup. Short-query clearing lives in onQueryChange so the
  // effect body never calls setState synchronously.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      startSearch(async () => {
        const res = await searchProductsForQuote(q);
        setHits(res);
        setOpen(true);
      });
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // Close the results dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onQueryChange(v: string) {
    setQuery(v);
    if (v.trim().length < 2) {
      setHits([]);
      setOpen(false);
    }
  }

  const setField = (k: CustomerKey, v: string) =>
    setCustomer((c) => ({ ...c, [k]: v }));

  function addProduct(p: QuoteProductHit) {
    setItems((prev) =>
      prev.some((it) => it.productId === p.id)
        ? prev.map((it) =>
            it.productId === p.id
              ? { ...it, qty: String((Number(it.qty) || 0) + 1) }
              : it,
          )
        : [
            ...prev,
            {
              key: p.id,
              productId: p.id,
              sku: p.sku,
              name: p.name,
              oem: p.oem,
              qty: "1",
              unit: "",
            },
          ],
    );
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  const setItemField = (key: string, field: "qty" | "unit", value: string) =>
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)),
    );

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((it) => it.key !== key));

  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const totals = useMemo(
    () =>
      computeQuoteTotals(
        items.map((it) => ({ quantity: num(it.qty), unitPrice: num(it.unit) })),
        {
          discountPct: num(discountPct),
          shippingCost: num(shippingCost),
          vatRate: num(vatRate),
        },
      ),
    [items, discountPct, shippingCost, vatRate],
  );

  const canRender =
    items.length > 0 && items.every((it) => num(it.unit) > 0);

  async function viewPdf() {
    setError(null);
    setBusy(true);
    // Open the tab synchronously within the click gesture so popup blockers
    // don't kill it once the awaited fetch resolves.
    const win = window.open("", "_blank");
    try {
      const res = await fetch("/api/admin/quotes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map((it) => ({
            sku: it.sku,
            name: it.name,
            oem: it.oem,
            quantity: Math.max(1, Math.round(num(it.qty))),
            unitPrice: num(it.unit),
          })),
          currency,
          discountPct: num(discountPct),
          shippingCost: num(shippingCost),
          shippingMode,
          vatRate: num(vatRate),
          validUntil,
          paymentTerms,
          note,
        }),
      });
      if (!res.ok) {
        setError("PDF oluşturulamadı. Alanları kontrol edip tekrar deneyin.");
        win?.close();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (win) {
        win.location.href = url;
      } else {
        setError("Tarayıcı yeni sekmeyi engelledi. İzin verip tekrar deneyin.");
      }
      // Revoke later so the viewer tab has time to load the document.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("PDF oluşturulamadı. Bağlantınızı kontrol edin.");
      win?.close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="qq">
      {/* ── Alıcı bilgileri ── */}
      <section className="mv-card qq-card">
        <div className="qq-card__head">
          <div className="qq-card__ttl">Alıcı bilgileri</div>
          <div className="qq-card__sub">Tümü opsiyonel — yalnızca PDF başlığında görünür</div>
        </div>
        <div className="qq-form">
          {FIELDS.map((f) => (
            <label className="qq-field" key={f.k}>
              <span>{f.label}</span>
              <input
                type={f.type ?? "text"}
                value={customer[f.k]}
                onChange={(e) => setField(f.k, e.target.value)}
              />
            </label>
          ))}
          <label className="qq-field qq-field--wide">
            <span>Adres</span>
            <textarea
              rows={2}
              value={customer.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* ── Parçalar & fiyatlandırma ── */}
      <section className="mv-card qq-card">
        <div className="qq-card__head">
          <div className="qq-card__ttl">Parçalar &amp; fiyatlandırma</div>
          <div className="qq-card__sub">
            {items.length} kalem · {totalQty} adet
          </div>
        </div>

        <div className="qq-searchwrap">
          <div className="qq-search" ref={boxRef}>
            <span className="qq-search__ico">
              <Icons.search />
            </span>
            <input
              className="qq-search__input"
              placeholder="SKU, ürün adı veya OEM numarası ile ara…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => hits.length > 0 && setOpen(true)}
            />
            {searching && <span className="qq-search__spin">aranıyor…</span>}

            {open && (
              <div className="qq-results">
                {hits.length === 0 ? (
                  <div className="qq-results__empty">Eşleşen ürün yok.</div>
                ) : (
                  hits.map((h) => (
                    <button
                      type="button"
                      key={h.id}
                      className="qq-result"
                      onClick={() => addProduct(h)}
                    >
                      <span className="qq-result__sku mv-mono">{h.sku}</span>
                      <span className="qq-result__name">{h.name}</span>
                      {h.oem && <span className="qq-result__oem mv-mono">{h.oem}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mv-empty qq-empty">
            Henüz parça eklenmedi. Yukarıdaki kutudan arayıp ekleyin.
          </div>
        ) : (
          <table className="mv-table qp-table">
            <thead>
              <tr>
                <th>Parça (SKU)</th>
                <th>Açıklama / OEM</th>
                <th className="mv-num">Adet</th>
                <th className="mv-num">Birim ({currency})</th>
                <th className="mv-num">Tutar</th>
                <th aria-label="Kaldır" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.key}>
                  <td>
                    <span className="mv-mono mv-ref">{it.sku}</span>
                  </td>
                  <td>
                    <div className="qp-name">{it.name}</div>
                    {it.oem && <div className="qp-oem mv-mono">{it.oem}</div>}
                  </td>
                  <td className="mv-num">
                    <input
                      className="qp-input qp-input--qty"
                      inputMode="numeric"
                      value={it.qty}
                      onChange={(e) => setItemField(it.key, "qty", e.target.value)}
                    />
                  </td>
                  <td className="mv-num">
                    <input
                      className="qp-input qp-input--unit"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={it.unit}
                      onChange={(e) => setItemField(it.key, "unit", e.target.value)}
                    />
                  </td>
                  <td className="mv-num qp-line">
                    {formatMoney(num(it.qty) * num(it.unit), currency)}
                  </td>
                  <td className="mv-num">
                    <button
                      type="button"
                      className="qq-del"
                      onClick={() => removeItem(it.key)}
                      aria-label="Kaldır"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Ayarlar + toplamlar */}
        <div className="qq-price">
          <div className="qp-settings">
            <div className="qp-settings__ttl">Teklif ayarları</div>
            <label className="qp-field">
              <span>Para birimi</span>
              <select
                className="qp-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
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

        {/* Notlar — PDF'e yazılır */}
        <div className="qq-notes">
          <label className="qq-notes__label" htmlFor="qq-note">
            Notlar <span className="qq-notes__hint">PDF&apos;e yazılır — müşteri görür</span>
          </label>
          <textarea
            id="qq-note"
            className="qq-notes__input"
            rows={3}
            maxLength={2000}
            placeholder="Teklife özel açıklama / koşullar… (ör. Montaj dâhildir; fiyatlar stok durumuna göre teyit edilir.)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* PDF indir */}
        <div className="qq-actions">
          {error && <span className="qq-actions__err">{error}</span>}
          <button
            type="button"
            className={
              "mv-btn mv-btn--primary" + (canRender ? "" : " mv-btn--disabled")
            }
            disabled={!canRender || busy}
            title={canRender ? undefined : "Tüm kalemlere birim fiyat girin"}
            onClick={viewPdf}
          >
            {busy ? "PDF hazırlanıyor…" : "PDF görüntüle ↗"}
          </button>
        </div>
      </section>
    </div>
  );
}
