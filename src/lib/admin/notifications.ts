import "server-only";

import { QuoteEventType, QuoteStatus, SubmissionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminNotification = {
  id: string;
  type: "quote" | "contact" | "application";
  title: string;
  sub: string;
  timeLabel: string;
  href: string;
};

// Müşteri takip olaylarının panel bildirim metinleri.
const EVENT_SUB: Record<QuoteEventType, string> = {
  LINK_OPENED: "Teklifini görüntüledi",
  DECISION_APPROVE: "Teklifi onayladı ✓",
  DECISION_REVISION: "Revizyon istedi",
  DECISION_CONTACT: "Görüşmek istiyor",
  DECISION_DECLINE: "Teklifi uygun bulmadı",
};

function relative(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "dün";
  return `${d} gün önce`;
}

export async function getNotifications(limit = 8): Promise<AdminNotification[]> {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [quotes, contacts, apps, events] = await Promise.all([
    prisma.quoteRequest.findMany({
      where: { status: QuoteStatus.NEW, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, companyName: true, createdAt: true },
    }),
    prisma.contactMessage.findMany({
      where: { status: SubmissionStatus.NEW },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, fullName: true, subject: true, createdAt: true },
    }),
    prisma.jobApplication.findMany({
      where: { status: SubmissionStatus.NEW },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, fullName: true, position: true, createdAt: true },
    }),
    prisma.quoteEvent.findMany({
      where: { createdAt: { gte: weekAgo } },
      orderBy: { createdAt: "desc" },
      take: limit * 3,
      select: {
        id: true,
        type: true,
        createdAt: true,
        quoteRequestId: true,
        quoteRequest: { select: { companyName: true } },
      },
    }),
  ]);

  // Aynı teklifin tekrarlanan görüntülemelerini teke indir (kararlar aynen kalır).
  const seenOpen = new Set<string>();
  const eventItems: (AdminNotification & { ts: number })[] = [];
  for (const e of events) {
    if (e.type === QuoteEventType.LINK_OPENED) {
      if (seenOpen.has(e.quoteRequestId)) continue;
      seenOpen.add(e.quoteRequestId);
    }
    eventItems.push({
      id: e.id,
      type: "quote" as const,
      title: e.quoteRequest.companyName,
      sub: EVENT_SUB[e.type],
      timeLabel: relative(e.createdAt, now),
      href: `/admin/inquiries/${e.quoteRequestId}`,
      ts: e.createdAt.getTime(),
    });
  }

  const items: (AdminNotification & { ts: number })[] = [
    ...quotes.map((q) => ({
      id: q.id,
      type: "quote" as const,
      title: q.companyName,
      sub: "Yeni teklif talebi",
      timeLabel: relative(q.createdAt, now),
      href: `/admin/inquiries/${q.id}`,
      ts: q.createdAt.getTime(),
    })),
    ...contacts.map((c) => ({
      id: c.id,
      type: "contact" as const,
      title: c.fullName,
      sub: c.subject?.trim() || "İletişim mesajı",
      timeLabel: relative(c.createdAt, now),
      href: `/admin/messages/contact/${c.id}`,
      ts: c.createdAt.getTime(),
    })),
    ...apps.map((a) => ({
      id: a.id,
      type: "application" as const,
      title: a.fullName,
      sub: `İş başvurusu · ${a.position}`,
      timeLabel: relative(a.createdAt, now),
      href: `/admin/messages/application/${a.id}`,
      ts: a.createdAt.getTime(),
    })),
    ...eventItems,
  ];

  return items
    .sort((x, y) => y.ts - x.ts)
    .slice(0, limit)
    .map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      sub: n.sub,
      timeLabel: n.timeLabel,
      href: n.href,
    }));
}
