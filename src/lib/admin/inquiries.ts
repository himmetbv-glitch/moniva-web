import "server-only";

import { QuoteStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  computeQuoteTotals,
  type Currency,
  type QuoteTotals,
} from "./quote-pricing";

export type InquiryPriority = "high" | "med" | "low";

export type InquiryRow = {
  id: string;
  ref: string;
  companyName: string;
  fullName: string;
  email: string;
  country: string;
  itemCount: number;
  status: QuoteStatus;
  timeLabel: string;
  priority: InquiryPriority;
};

export type InquirySummary = {
  total: number;
  newCount: number;
  quoted: number;
  closed: number;
  weekCount: number;
  archived: number;
};

export type InquiryListResult = {
  rows: InquiryRow[];
  summary: InquirySummary;
};

export type InquiryItem = {
  id: string;
  sku: string;
  name: string;
  oem: string | null;
  quantity: number;
  unitPrice: number | null;
};

export type InquiryDetail = {
  id: string;
  ref: string;
  status: QuoteStatus;
  isArchived: boolean;
  createdAtLabel: string;
  timeLabel: string;
  // müşteri
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  city: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  address: string;
  notes: string | null;
  marketingConsent: boolean;
  currency: Currency;
  adminNotes: string | null;
  items: InquiryItem[];
  totalQty: number;
  // Fiyatlandırma (teklif cevabı)
  discountPct: number;
  shippingCost: number;
  shippingMode: string | null;
  vatRate: number;
  validUntil: string | null;
  validUntilValue: string | null; // <input type="date"> için ISO (yyyy-mm-dd)
  paymentTerms: string | null;
  quotedAtLabel: string | null;
  totals: QuoteTotals;
  hasPricing: boolean; // en az bir kalemde birim fiyat girilmiş mi
};

const REF_PREFIX = "QR-";

function refOf(id: string): string {
  return `${REF_PREFIX}${id.slice(-6).toUpperCase()}`;
}

function relativeLabel(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  return d === 1 ? "dün" : `${d} gün önce`;
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnlyFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

// <input type="date"> ve PDF için yyyy-mm-dd (yerel saat)
function isoDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Şemada öncelik alanı yok — yenilik + büyüklükten türetilir (heuristik).
function derivePriority(status: QuoteStatus, itemCount: number): InquiryPriority {
  if (status === QuoteStatus.NEW && itemCount >= 10) return "high";
  if (status === QuoteStatus.NEW) return "med";
  return "low";
}

export async function getInquiryList(
  statusFilter?: QuoteStatus,
  q?: string,
  archived = false,
): Promise<InquiryListResult> {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const where: Prisma.QuoteRequestWhereInput = { isArchived: archived };
  if (!archived && statusFilter) where.status = statusFilter;
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { companyName: { contains: term, mode: "insensitive" } },
      { fullName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  // Özet sayıları her zaman arşivlenmemiş kayıtlar üzerinden (arşiv hariç).
  const active: Prisma.QuoteRequestWhereInput = { isArchived: false };

  const [rows, total, newCount, quoted, closed, weekCount, archivedCount] =
    await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          companyName: true,
          fullName: true,
          email: true,
          country: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.quoteRequest.count({ where: active }),
      prisma.quoteRequest.count({ where: { ...active, status: QuoteStatus.NEW } }),
      prisma.quoteRequest.count({ where: { ...active, status: QuoteStatus.QUOTED } }),
      prisma.quoteRequest.count({ where: { ...active, status: QuoteStatus.CLOSED } }),
      prisma.quoteRequest.count({ where: { ...active, createdAt: { gte: weekAgo } } }),
      prisma.quoteRequest.count({ where: { isArchived: true } }),
    ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      ref: refOf(r.id),
      companyName: r.companyName,
      fullName: r.fullName,
      email: r.email,
      country: r.country,
      itemCount: r._count.items,
      status: r.status,
      timeLabel: relativeLabel(r.createdAt, now),
      priority: derivePriority(r.status, r._count.items),
    })),
    summary: { total, newCount, quoted, closed, weekCount, archived: archivedCount },
  };
}

export async function getInquiryDetail(id: string): Promise<InquiryDetail | null> {
  const now = Date.now();
  const r = await prisma.quoteRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      isArchived: true,
      createdAt: true,
      fullName: true,
      companyName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      taxNumber: true,
      taxOffice: true,
      address: true,
      notes: true,
      marketingConsent: true,
      currency: true,
      notes_admin: true,
      discountPct: true,
      shippingCost: true,
      shippingMode: true,
      vatRate: true,
      validUntil: true,
      paymentTerms: true,
      quotedAt: true,
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

  const items: InquiryItem[] = r.items.map((it) => {
    const ref = it.product?.oemReferences[0];
    return {
      id: it.id,
      sku: it.snapshotSku,
      name: it.snapshotName,
      oem: ref ? `${ref.manufacturer} ${ref.oemNumber}`.trim() : null,
      quantity: it.quantity,
      unitPrice: it.unitPrice == null ? null : it.unitPrice.toNumber(),
    };
  });

  const currency = r.currency as Currency;
  const discountPct = r.discountPct?.toNumber() ?? 0;
  const shippingCost = r.shippingCost?.toNumber() ?? 0;
  const vatRate = r.vatRate?.toNumber() ?? 0;
  const totals = computeQuoteTotals(
    items.map((it) => ({ quantity: it.quantity, unitPrice: it.unitPrice ?? 0 })),
    { discountPct, shippingCost, vatRate },
  );

  return {
    id: r.id,
    ref: refOf(r.id),
    status: r.status,
    isArchived: r.isArchived,
    createdAtLabel: dateFmt.format(r.createdAt),
    timeLabel: relativeLabel(r.createdAt, now),
    fullName: r.fullName,
    companyName: r.companyName,
    email: r.email,
    phone: r.phone,
    country: r.country,
    city: r.city,
    taxNumber: r.taxNumber,
    taxOffice: r.taxOffice,
    address: r.address,
    notes: r.notes,
    marketingConsent: r.marketingConsent,
    currency,
    adminNotes: r.notes_admin,
    items,
    totalQty: r.items.reduce((s, it) => s + it.quantity, 0),
    discountPct,
    shippingCost,
    shippingMode: r.shippingMode,
    vatRate,
    validUntil: r.validUntil ? dateOnlyFmt.format(r.validUntil) : null,
    validUntilValue: r.validUntil ? isoDateOnly(r.validUntil) : null,
    paymentTerms: r.paymentTerms,
    quotedAtLabel: r.quotedAt ? dateFmt.format(r.quotedAt) : null,
    totals,
    hasPricing: items.some((it) => it.unitPrice != null && it.unitPrice > 0),
  };
}
