import "server-only";

import { QuoteStatus, SubmissionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminNotification = {
  id: string;
  type: "quote" | "contact" | "application";
  title: string;
  sub: string;
  timeLabel: string;
  href: string;
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

  const [quotes, contacts, apps] = await Promise.all([
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
  ]);

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
