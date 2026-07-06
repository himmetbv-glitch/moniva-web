import "server-only";

import { QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeQuoteTotals, formatMoney, type Currency } from "./quote-pricing";

export type ReportMetric = { count: number; amountLabel: string };

export type ReportRow = {
  id: string;
  ref: string;
  companyName: string;
  sentAtLabel: string;
  status: QuoteStatus;
  viewCount: number;
  amountLabel: string;
};

export type QuoteReport = {
  monthKey: string; // "2026-07"
  monthLabel: string; // "Temmuz 2026"
  prevMonth: string;
  nextMonth: string | null; // gelecekteki ay → null
  sent: ReportMetric;
  opened: ReportMetric;
  approved: ReportMetric;
  pending: ReportMetric; // cevapsız / karar bekleyen
  lost: ReportMetric;
  rows: ReportRow[];
};

const CURRENCIES: Currency[] = ["TRY", "USD", "EUR"];

type Bucket = { count: number; amounts: Map<Currency, number> };
function newBucket(): Bucket {
  return { count: 0, amounts: new Map() };
}
function add(b: Bucket, cur: Currency, amount: number) {
  b.count += 1;
  b.amounts.set(cur, (b.amounts.get(cur) ?? 0) + amount);
}
function toMetric(b: Bucket): ReportMetric {
  const parts: string[] = [];
  for (const cur of CURRENCIES) {
    const v = b.amounts.get(cur);
    if (v && v > 0) parts.push(formatMoney(v, cur));
  }
  return { count: b.count, amountLabel: parts.length ? parts.join(" · ") : "—" };
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export function normalizeMonthKey(input?: string): string {
  if (input && /^\d{4}-\d{2}$/.test(input)) {
    const m = Number(input.slice(5));
    if (m >= 1 && m <= 12) return input;
  }
  return currentMonthKey();
}

const rowDateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
});

const LOST = new Set<QuoteStatus>([
  QuoteStatus.DECLINED,
  QuoteStatus.EXPIRED,
  QuoteStatus.CLOSED,
]);

export async function getQuoteReport(monthInput?: string): Promise<QuoteReport> {
  const monthKey = normalizeMonthKey(monthInput);
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);

  const monthLabel = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(start);

  // Kohort: bu ay fiyatlanıp gönderilen teklifler (quotedAt bu ayda).
  const quotes = await prisma.quoteRequest.findMany({
    where: { quotedAt: { gte: start, lt: end } },
    orderBy: { quotedAt: "desc" },
    select: {
      id: true,
      companyName: true,
      status: true,
      quotedAt: true,
      firstViewedAt: true,
      viewCount: true,
      currency: true,
      discountPct: true,
      shippingCost: true,
      vatRate: true,
      items: { select: { quantity: true, unitPrice: true } },
    },
  });

  const sent = newBucket();
  const opened = newBucket();
  const approved = newBucket();
  const pending = newBucket();
  const lost = newBucket();
  const rows: ReportRow[] = [];

  for (const q of quotes) {
    const cur = q.currency as Currency;
    const total = computeQuoteTotals(
      q.items.map((it) => ({
        quantity: it.quantity,
        unitPrice: it.unitPrice?.toNumber() ?? 0,
      })),
      {
        discountPct: q.discountPct?.toNumber() ?? 0,
        shippingCost: q.shippingCost?.toNumber() ?? 0,
        vatRate: q.vatRate?.toNumber() ?? 0,
      },
    ).total;

    add(sent, cur, total);
    if (q.firstViewedAt) add(opened, cur, total);
    if (q.status === QuoteStatus.APPROVED) add(approved, cur, total);
    else if (LOST.has(q.status)) add(lost, cur, total);
    else add(pending, cur, total); // QUOTED, VIEWED, REVISION_REQUESTED

    rows.push({
      id: q.id,
      ref: `QR-${q.id.slice(-6).toUpperCase()}`,
      companyName: q.companyName,
      sentAtLabel: q.quotedAt ? rowDateFmt.format(q.quotedAt) : "—",
      status: q.status,
      viewCount: q.viewCount,
      amountLabel: formatMoney(total, cur),
    });
  }

  const nextKey = shiftMonth(monthKey, 1);
  const nextMonth = nextKey > currentMonthKey() ? null : nextKey;

  return {
    monthKey,
    monthLabel,
    prevMonth: shiftMonth(monthKey, -1),
    nextMonth,
    sent: toMetric(sent),
    opened: toMetric(opened),
    approved: toMetric(approved),
    pending: toMetric(pending),
    lost: toMetric(lost),
    rows,
  };
}
