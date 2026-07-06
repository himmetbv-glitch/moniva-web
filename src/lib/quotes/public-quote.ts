import "server-only";

import { QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  computeQuoteTotals,
  type Currency,
  type QuoteTotals,
} from "@/lib/admin/quote-pricing";

export type PublicQuoteItem = {
  id: string;
  sku: string;
  name: string;
  oem: string | null;
  quantity: number;
  unitPrice: number;
};

export type PublicQuote = {
  ref: string;
  status: QuoteStatus;
  companyName: string;
  fullName: string;
  currency: Currency;
  sentAtLabel: string | null;
  validUntilLabel: string | null;
  isExpired: boolean;
  shippingMode: string | null;
  paymentTerms: string | null;
  customerNote: string | null;
  items: PublicQuoteItem[];
  totalQty: number;
  discountPct: number;
  shippingCost: number;
  vatRate: number;
  totals: QuoteTotals;
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export async function getPublicQuoteByToken(
  token: string,
): Promise<PublicQuote | null> {
  if (!token || token.length < 8) return null;

  const r = await prisma.quoteRequest.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      status: true,
      companyName: true,
      fullName: true,
      currency: true,
      sentAt: true,
      validUntil: true,
      notes: true,
      shippingMode: true,
      paymentTerms: true,
      discountPct: true,
      shippingCost: true,
      vatRate: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          snapshotSku: true,
          snapshotName: true,
          quantity: true,
          unitPrice: true,
          product: {
            select: {
              oemReferences: {
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { manufacturer: true, oemNumber: true },
              },
            },
          },
        },
      },
    },
  });

  if (!r) return null;

  const items: PublicQuoteItem[] = r.items.map((it) => {
    const ref = it.product?.oemReferences[0];
    return {
      id: it.id,
      sku: it.snapshotSku,
      name: it.snapshotName,
      oem: ref ? [ref.manufacturer, ref.oemNumber].filter(Boolean).join(" ") : null,
      quantity: it.quantity,
      unitPrice: it.unitPrice == null ? 0 : it.unitPrice.toNumber(),
    };
  });

  const currency = r.currency as Currency;
  const discountPct = r.discountPct?.toNumber() ?? 0;
  const shippingCost = r.shippingCost?.toNumber() ?? 0;
  const vatRate = r.vatRate?.toNumber() ?? 0;
  const totals = computeQuoteTotals(
    items.map((it) => ({ quantity: it.quantity, unitPrice: it.unitPrice })),
    { discountPct, shippingCost, vatRate },
  );

  const isExpired = r.validUntil ? r.validUntil.getTime() < Date.now() : false;

  return {
    ref: `QR-${r.id.slice(-6).toUpperCase()}`,
    status: r.status,
    companyName: r.companyName,
    fullName: r.fullName,
    currency,
    sentAtLabel: r.sentAt ? dateFmt.format(r.sentAt) : null,
    validUntilLabel: r.validUntil ? dateFmt.format(r.validUntil) : null,
    isExpired,
    shippingMode: r.shippingMode,
    paymentTerms: r.paymentTerms,
    customerNote: r.notes,
    items,
    totalQty: items.reduce((s, it) => s + it.quantity, 0),
    discountPct,
    shippingCost,
    vatRate,
    totals,
  };
}
