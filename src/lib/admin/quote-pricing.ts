// Teklif fiyat hesabı — saf modül (client + server + PDF ortak kullanır).
// "server-only" YOK; client component canlı toplam için de import eder.

export type Currency = "TRY" | "USD" | "EUR";

export type PricingLine = { quantity: number; unitPrice: number };

export type PricingSettings = {
  discountPct: number;
  shippingCost: number;
  vatRate: number;
};

export type QuoteTotals = {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxableBase: number;
  vatAmount: number;
  total: number;
};

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeQuoteTotals(
  lines: PricingLine[],
  s: PricingSettings,
): QuoteTotals {
  const subtotal = r2(
    lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0), 0),
  );
  const discountAmount = r2(subtotal * (clampPct(s.discountPct) / 100));
  const shippingCost = r2(Math.max(0, s.shippingCost || 0));
  const taxableBase = r2(subtotal - discountAmount + shippingCost);
  const vatAmount = r2(taxableBase * (clampPct(s.vatRate) / 100));
  const total = r2(taxableBase + vatAmount);
  return { subtotal, discountAmount, shippingCost, taxableBase, vatAmount, total };
}

function clampPct(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 100);
}

const CURRENCY_LOCALE: Record<Currency, string> = {
  TRY: "tr-TR",
  USD: "en-US",
  EUR: "de-DE",
};

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export const SHIPPING_MODES = [
  "DAP — Kamyon",
  "FCA — Konya",
  "EXW — Konya",
  "DAP — Hava",
  "CIF — Liman",
] as const;
