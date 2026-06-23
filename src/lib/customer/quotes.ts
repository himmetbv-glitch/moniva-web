import "server-only";

import { QuoteStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { QuotePrefill } from "@/lib/actions/quote-types";
import {
  computeQuoteTotals,
  formatMoney,
  type Currency,
  type QuoteTotals,
} from "@/lib/admin/quote-pricing";

// Teklif formu otomatik dolum verisi (giriş yoksa null).
export async function getQuotePrefill(): Promise<QuotePrefill | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, companyName: true, taxNumber: true, phone: true },
  });
  if (!u) return null;

  return {
    fullName: u.name ?? "",
    companyName: u.companyName ?? "",
    email: u.email ?? "",
    // Yerel kısım — sabit +90 ülke kodu formda ayrı; baştaki kodu/sıfırı temizle.
    phone: (u.phone ?? "").replace(/^\+90\s*/, "").trim(),
    taxNumber: u.taxNumber ?? "",
  };
}

export type MyQuoteRow = {
  id: string;
  ref: string;
  status: QuoteStatus;
  itemCount: number;
  createdAtLabel: string;
  totalLabel: string | null; // yalnız fiyatlandırılmışsa
};

export type MyQuoteItem = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceLabel: string | null;
  lineTotalLabel: string | null;
};

export type MyQuoteDetail = {
  id: string;
  ref: string;
  status: QuoteStatus;
  createdAtLabel: string;
  quotedAtLabel: string | null;
  companyName: string;
  address: string;
  city: string | null;
  country: string;
  notes: string | null;
  currency: Currency;
  items: MyQuoteItem[];
  totalQty: number;
  priced: boolean; // teklif verildi mi (fiyatlar görünür mü)
  // fiyatlandırma (yalnız priced ise dolu)
  totals: QuoteTotals;
  totalsLabels: {
    subtotal: string;
    discount: string;
    shipping: string;
    vat: string;
    total: string;
  };
  discountPct: number;
  vatRate: number;
  shippingMode: string | null;
  validUntilLabel: string | null;
  paymentTerms: string | null;
};

const REF_PREFIX = "QR-";
const refOf = (id: string) => `${REF_PREFIX}${id.slice(-6).toUpperCase()}`;

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function getMyQuotes(userId: string): Promise<MyQuoteRow[]> {
  const rows = await prisma.quoteRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      createdAt: true,
      currency: true,
      discountPct: true,
      shippingCost: true,
      vatRate: true,
      items: { select: { quantity: true, unitPrice: true } },
    },
  });

  return rows.map((r) => {
    const priced =
      r.status === QuoteStatus.QUOTED &&
      r.items.some((it) => it.unitPrice != null);
    let totalLabel: string | null = null;
    if (priced) {
      const totals = computeQuoteTotals(
        r.items.map((it) => ({
          quantity: it.quantity,
          unitPrice: it.unitPrice?.toNumber() ?? 0,
        })),
        {
          discountPct: r.discountPct?.toNumber() ?? 0,
          shippingCost: r.shippingCost?.toNumber() ?? 0,
          vatRate: r.vatRate?.toNumber() ?? 0,
        },
      );
      totalLabel = formatMoney(totals.total, r.currency as Currency);
    }
    return {
      id: r.id,
      ref: refOf(r.id),
      status: r.status,
      itemCount: r.items.length,
      createdAtLabel: dateFmt.format(r.createdAt),
      totalLabel,
    };
  });
}

// userId'ye ait DEĞİLSE null — sahiplik zorunlu (yetki sızıntısı engeli).
export async function getMyQuoteDetail(
  userId: string,
  id: string,
): Promise<MyQuoteDetail | null> {
  const r = await prisma.quoteRequest.findFirst({
    where: { id, userId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      quotedAt: true,
      companyName: true,
      address: true,
      city: true,
      country: true,
      notes: true,
      currency: true,
      discountPct: true,
      shippingCost: true,
      vatRate: true,
      shippingMode: true,
      validUntil: true,
      paymentTerms: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          snapshotSku: true,
          snapshotName: true,
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });
  if (!r) return null;

  const currency = r.currency as Currency;
  const priced =
    r.status === QuoteStatus.QUOTED && r.items.some((it) => it.unitPrice != null);

  const totals = computeQuoteTotals(
    r.items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unitPrice?.toNumber() ?? 0,
    })),
    {
      discountPct: r.discountPct?.toNumber() ?? 0,
      shippingCost: r.shippingCost?.toNumber() ?? 0,
      vatRate: r.vatRate?.toNumber() ?? 0,
    },
  );

  const items: MyQuoteItem[] = r.items.map((it) => {
    const unit = it.unitPrice?.toNumber() ?? null;
    return {
      id: it.id,
      sku: it.snapshotSku,
      name: it.snapshotName,
      quantity: it.quantity,
      unitPriceLabel: priced && unit != null ? formatMoney(unit, currency) : null,
      lineTotalLabel:
        priced && unit != null ? formatMoney(unit * it.quantity, currency) : null,
    };
  });

  return {
    id: r.id,
    ref: refOf(r.id),
    status: r.status,
    createdAtLabel: dateTimeFmt.format(r.createdAt),
    quotedAtLabel: r.quotedAt ? dateTimeFmt.format(r.quotedAt) : null,
    companyName: r.companyName,
    address: r.address,
    city: r.city,
    country: r.country,
    notes: r.notes,
    currency,
    items,
    totalQty: r.items.reduce((s, it) => s + it.quantity, 0),
    priced,
    totals,
    totalsLabels: {
      subtotal: formatMoney(totals.subtotal, currency),
      discount: formatMoney(totals.discountAmount, currency),
      shipping: formatMoney(totals.shippingCost, currency),
      vat: formatMoney(totals.vatAmount, currency),
      total: formatMoney(totals.total, currency),
    },
    discountPct: r.discountPct?.toNumber() ?? 0,
    vatRate: r.vatRate?.toNumber() ?? 0,
    shippingMode: r.shippingMode,
    validUntilLabel: r.validUntil ? dateFmt.format(r.validUntil) : null,
    paymentTerms: r.paymentTerms,
  };
}

// PDF route için hafif sahiplik + fiyatlandırma kontrolü.
export async function isMyQuotePriced(
  userId: string,
  id: string,
): Promise<boolean> {
  const r = await prisma.quoteRequest.findFirst({
    where: { id, userId, status: QuoteStatus.QUOTED },
    select: { id: true },
  });
  return Boolean(r);
}
