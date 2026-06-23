import "server-only";

import { prisma } from "@/lib/prisma";

export type LoginActivity = {
  id: string;
  initials: string;
  company: string;
  ref: string;
  timeLabel: string;
};

export type LoginPanelData = {
  rfq30d: number;
  productsLive: number;
  brands: number;
  activity: LoginActivity[];
};

function relativeLabel(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min}dk`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}sa`;
  return `${Math.round(hr / 24)}g`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MN";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? "");
  return (first + last).toUpperCase();
}

/**
 * Brand-panel aggregates for the login screen. Real catalogue/quote numbers
 * where the schema allows; the activity feed is fed by the latest quote
 * requests (there is no separate audit-log model yet).
 */
export async function getLoginPanelData(): Promise<LoginPanelData> {
  const now = Date.now();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [rfq30d, productsLive, brands, recent] = await Promise.all([
    prisma.quoteRequest.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.brand.count(),
    prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, fullName: true, companyName: true, createdAt: true },
    }),
  ]);

  return {
    rfq30d,
    productsLive,
    brands,
    activity: recent.map((q) => ({
      id: q.id,
      initials: initialsOf(q.fullName),
      company: q.companyName,
      ref: `QR-${q.id.slice(-6).toUpperCase()}`,
      timeLabel: relativeLabel(q.createdAt, now),
    })),
  };
}
