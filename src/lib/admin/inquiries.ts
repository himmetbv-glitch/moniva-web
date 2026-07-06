import "server-only";

import { QuoteEventType, QuoteStatus, type Prisma } from "@prisma/client";

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
  publicToken: string | null;
  viewCount: number;
  lastActivityLabel: string;
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

export type ActivityTone = "base" | "open" | "ok" | "warn" | "err" | "info";

export type ActivityItem = {
  key: string;
  label: string;
  note: string | null;
  timeLabel: string; // "3 sa önce"
  absLabel: string; // "06 Temmuz 2026 10:03"
  tone: ActivityTone;
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
  publicToken: string | null; // izlenebilir müşteri linki (gönderildiyse)
  isExpiringSoon: boolean; // geçerlilik ≤5 gün veya doldu
  viewCount: number;
  activity: ActivityItem[]; // gerçek müşteri hareketleri (yeni→eski)
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

const EVENT_LABEL: Record<QuoteEventType, { label: string; tone: ActivityTone }> = {
  LINK_OPENED: { label: "Bağlantı açıldı", tone: "open" },
  DECISION_APPROVE: { label: "Müşteri teklifi onayladı", tone: "ok" },
  DECISION_REVISION: { label: "Müşteri revizyon istedi", tone: "warn" },
  DECISION_CONTACT: { label: "Müşteri görüşmek istiyor", tone: "info" },
  DECISION_DECLINE: { label: "Müşteri teklifi uygun bulmadı", tone: "err" },
};

const DEVICE_TR: Record<string, string> = { mobile: "mobil", desktop: "masaüstü" };

// Şemada öncelik alanı yok — yenilik + büyüklükten türetilir (heuristik).
function derivePriority(status: QuoteStatus, itemCount: number): InquiryPriority {
  if (status === QuoteStatus.NEW && itemCount >= 10) return "high";
  if (status === QuoteStatus.NEW) return "med";
  return "low";
}

// Son hareket = kaydın en güncel anlamlı zaman damgası (talep/gönderim/görüntülenme/karar).
function lastActivityAt(r: {
  createdAt: Date;
  sentAt: Date | null;
  quotedAt: Date | null;
  lastViewedAt: Date | null;
  events: { createdAt: Date }[];
}): Date {
  let latest = r.createdAt;
  for (const d of [r.sentAt, r.quotedAt, r.lastViewedAt, r.events[0]?.createdAt]) {
    if (d && d.getTime() > latest.getTime()) latest = d;
  }
  return latest;
}

export async function getInquiryList(
  statusFilter?: QuoteStatus | QuoteStatus[],
  q?: string,
  archived = false,
): Promise<InquiryListResult> {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const where: Prisma.QuoteRequestWhereInput = { isArchived: archived };
  if (!archived && statusFilter) {
    where.status = Array.isArray(statusFilter) ? { in: statusFilter } : statusFilter;
  }
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
          publicToken: true,
          viewCount: true,
          sentAt: true,
          quotedAt: true,
          lastViewedAt: true,
          _count: { select: { items: true } },
          events: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
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
      publicToken: r.publicToken,
      viewCount: r.viewCount,
      lastActivityLabel: relativeLabel(lastActivityAt(r), now),
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
      publicToken: true,
      sentAt: true,
      viewCount: true,
      events: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          type: true,
          device: true,
          note: true,
          createdAt: true,
        },
      },
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

  // Gerçek hareket akışı: olaylar + sentetik "gönderildi"/"oluşturuldu" (yeni→eski).
  const rawActivity: (ActivityItem & { ts: number })[] = r.events.map((e) => {
    const meta = EVENT_LABEL[e.type];
    const dev = e.device ? (DEVICE_TR[e.device] ?? e.device) : null;
    return {
      key: e.id,
      label:
        e.type === QuoteEventType.LINK_OPENED && dev
          ? `${meta.label} · ${dev}`
          : meta.label,
      note: e.note ?? null,
      timeLabel: relativeLabel(e.createdAt, now),
      absLabel: dateFmt.format(e.createdAt),
      tone: meta.tone,
      ts: e.createdAt.getTime(),
    };
  });
  if (r.sentAt) {
    rawActivity.push({
      key: "sent",
      label: "Teklif gönderildi · izlenebilir link",
      note: null,
      timeLabel: relativeLabel(r.sentAt, now),
      absLabel: dateFmt.format(r.sentAt),
      tone: "info",
      ts: r.sentAt.getTime(),
    });
  }
  rawActivity.push({
    key: "created",
    label: "Teklif talebi oluşturuldu",
    note: null,
    timeLabel: relativeLabel(r.createdAt, now),
    absLabel: dateFmt.format(r.createdAt),
    tone: "base",
    ts: r.createdAt.getTime(),
  });
  const activity: ActivityItem[] = rawActivity
    .sort((a, b) => b.ts - a.ts)
    .map((a) => ({
      key: a.key,
      label: a.label,
      note: a.note,
      timeLabel: a.timeLabel,
      absLabel: a.absLabel,
      tone: a.tone,
    }));

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
    publicToken: r.publicToken,
    isExpiringSoon: r.validUntil
      ? r.validUntil.getTime() - now < 5 * 24 * 60 * 60 * 1000
      : false,
    viewCount: r.viewCount,
    activity,
  };
}
