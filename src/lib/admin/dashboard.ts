import "server-only";

import { QuoteStatus, SubmissionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";

export type RecentQuote = {
  id: string;
  ref: string;
  fullName: string;
  companyName: string;
  country: string;
  status: QuoteStatus;
  itemCount: number;
  timeLabel: string;
};

export type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  quotes: number;
};

export type DashTask = {
  text: string;
  due: string;
  kind: "warn" | "err" | "info";
};

export type SidebarCounts = {
  products: number;
  categories: number;
  newQuotes: number;
  newMessages: number;
  followUps: number;
};

export type DashboardData = {
  greeting: string;
  newQuotes: number;
  unreadMessages: number | null; // null → henüz mesaj modülü yok
  stats: {
    rfq30d: number;
    rfqDeltaPct: number | null;
    activeProducts: number;
    addedThisMonth: number;
    catalogueViews: number | null; // null → analytics yok
  };
  chart: {
    daily: number[];
    max: number;
    total: number;
    avgPerDay: string;
    avgPartsPerRfq: string;
  };
  tasks: DashTask[];
  recentQuotes: RecentQuote[];
  topProducts: TopProduct[];
};

export async function getAdminSidebarCounts(): Promise<SidebarCounts> {
  const [products, categories, newQuotes, newContacts, newApplications, followUps] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count(),
      prisma.quoteRequest.count({ where: { status: QuoteStatus.NEW } }),
      prisma.contactMessage.count({ where: { status: SubmissionStatus.NEW } }),
      prisma.jobApplication.count({ where: { status: SubmissionStatus.NEW } }),
      prisma.quoteRequest.count({
        where: {
          isArchived: false,
          status: { in: [QuoteStatus.VIEWED, QuoteStatus.REVISION_REQUESTED] },
        },
      }),
    ]);
  return {
    products,
    categories,
    newQuotes,
    newMessages: newContacts + newApplications,
    followUps,
  };
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

function greetingFor(now: number): string {
  // Selamlama Türkiye saatine göre (sunucu UTC olabilir — örn. Vercel).
  const hour =
    Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        hour12: false,
      }).format(now),
    ) % 24;
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const prevMonthStart = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const [
    activeProducts,
    addedThisMonth,
    rfq30d,
    rfqPrev30d,
    newQuotes,
    quotesInWindow,
    totalQuoteItems,
    totalQuotes,
    recent,
    topGrouped,
    inactiveProducts,
    newContacts,
    newApplications,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.quoteRequest.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.quoteRequest.count({
      where: { createdAt: { gte: prevMonthStart, lt: monthAgo } },
    }),
    prisma.quoteRequest.count({ where: { status: QuoteStatus.NEW } }),
    prisma.quoteRequest.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
    prisma.quoteRequestItem.count(),
    prisma.quoteRequest.count(),
    prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        fullName: true,
        companyName: true,
        country: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.quoteRequestItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.contactMessage.count({ where: { status: SubmissionStatus.NEW } }),
    prisma.jobApplication.count({ where: { status: SubmissionStatus.NEW } }),
  ]);

  const newMessages = newContacts + newApplications;

  // Daily buckets for last 30 days (oldest → newest).
  const daily = new Array(30).fill(0);
  for (const q of quotesInWindow) {
    const dayIdx = 29 - Math.floor((now - q.createdAt.getTime()) / 86400000);
    if (dayIdx >= 0 && dayIdx < 30) daily[dayIdx] += 1;
  }
  const max = Math.max(4, ...daily);

  const rfqDeltaPct =
    rfqPrev30d === 0 ? null : ((rfq30d - rfqPrev30d) / rfqPrev30d) * 100;

  // Top products — resolve names/SKUs in default locale.
  const topIds = topGrouped.map((g) => g.productId);
  const topProductRows =
    topIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topIds } },
          select: {
            id: true,
            sku: true,
            translations: { select: { locale: true, name: true } },
          },
        })
      : [];
  const topProducts: TopProduct[] = topGrouped.map((g) => {
    const p = topProductRows.find((r) => r.id === g.productId);
    const tr = p ? pickTranslation(p.translations, DEFAULT_LOCALE) : null;
    return {
      productId: g.productId,
      name: tr?.name ?? p?.sku ?? "—",
      sku: p?.sku ?? "—",
      quotes: g._count.productId,
    };
  });

  // Derived action items from real signals.
  const tasks: DashTask[] = [];
  if (newQuotes > 0)
    tasks.push({
      text: `${newQuotes} teklif talebi incelenmeyi bekliyor`,
      due: "Bugün",
      kind: "err",
    });
  if (inactiveProducts > 0)
    tasks.push({
      text: `${inactiveProducts} pasif ürün yayına alınmayı bekliyor`,
      due: "Bu hafta",
      kind: "warn",
    });
  if (addedThisMonth > 0)
    tasks.push({
      text: `${addedThisMonth} yeni ürün bu ay eklendi — gözden geçirin`,
      due: "Bu hafta",
      kind: "info",
    });

  const avgPerDay = (rfq30d / 30).toFixed(1);
  const avgPartsPerRfq =
    totalQuotes === 0 ? "0" : (totalQuoteItems / totalQuotes).toFixed(1);

  return {
    greeting: greetingFor(now),
    newQuotes,
    unreadMessages: newMessages,
    stats: {
      rfq30d,
      rfqDeltaPct,
      activeProducts,
      addedThisMonth,
      catalogueViews: null,
    },
    chart: {
      daily,
      max,
      total: rfq30d,
      avgPerDay,
      avgPartsPerRfq,
    },
    tasks,
    recentQuotes: recent.map((q) => ({
      id: q.id,
      ref: `QR-${q.id.slice(-6).toUpperCase()}`,
      fullName: q.fullName,
      companyName: q.companyName,
      country: q.country,
      status: q.status,
      itemCount: q._count.items,
      timeLabel: relativeLabel(q.createdAt, now),
    })),
    topProducts,
  };
}
