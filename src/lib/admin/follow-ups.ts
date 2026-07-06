import "server-only";

import { QuoteEventType, QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type FollowUpKind = "hot" | "revision";

export type FollowUp = {
  id: string;
  ref: string;
  companyName: string;
  fullName: string;
  phone: string;
  status: QuoteStatus;
  kind: FollowUpKind;
  viewCount: number;
  publicToken: string | null;
  whatHappened: string;
  note: string | null; // revizyon talebindeki müşteri notu
  lastActivityLabel: string;
  lastActivityAtMs: number;
};

export type FollowUpResult = {
  hot: FollowUp[];
  revision: FollowUp[];
  total: number;
};

function refOf(id: string): string {
  return `QR-${id.slice(-6).toUpperCase()}`;
}

function relative(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  return d === 1 ? "dün" : `${d} gün önce`;
}

// Takip gerektiren teklifler: müşteri açtı ama karar vermedi (VIEWED) ya da
// revizyon istedi (REVISION_REQUESTED). Satış temsilcisinin aksiyon alması beklenir.
export async function getFollowUps(): Promise<FollowUpResult> {
  const now = Date.now();

  const rows = await prisma.quoteRequest.findMany({
    where: {
      isArchived: false,
      status: { in: [QuoteStatus.VIEWED, QuoteStatus.REVISION_REQUESTED] },
    },
    orderBy: { lastViewedAt: "desc" },
    take: 60,
    select: {
      id: true,
      companyName: true,
      fullName: true,
      phone: true,
      status: true,
      viewCount: true,
      publicToken: true,
      createdAt: true,
      sentAt: true,
      quotedAt: true,
      lastViewedAt: true,
      firstViewedAt: true,
      events: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { type: true, note: true, createdAt: true },
      },
    },
  });

  const mapped: FollowUp[] = rows.map((r) => {
    const kind: FollowUpKind =
      r.status === QuoteStatus.REVISION_REQUESTED ? "revision" : "hot";

    // Son anlamlı hareket zamanı.
    let lastAt = r.createdAt;
    for (const d of [r.sentAt, r.quotedAt, r.lastViewedAt, r.events[0]?.createdAt]) {
      if (d && d.getTime() > lastAt.getTime()) lastAt = d;
    }

    let whatHappened: string;
    let note: string | null = null;
    if (kind === "revision") {
      const rev = r.events.find((e) => e.type === QuoteEventType.DECISION_REVISION);
      note = rev?.note?.trim() || null;
      whatHappened = "Revizyon istedi";
    } else {
      whatHappened =
        r.viewCount > 1
          ? `Teklifi görüntüledi · ${r.viewCount} kez`
          : "Teklifi görüntüledi";
    }

    return {
      id: r.id,
      ref: refOf(r.id),
      companyName: r.companyName,
      fullName: r.fullName,
      phone: r.phone,
      status: r.status,
      kind,
      viewCount: r.viewCount,
      publicToken: r.publicToken,
      whatHappened,
      note,
      lastActivityLabel: relative(lastAt, now),
      lastActivityAtMs: lastAt.getTime(),
    };
  });

  mapped.sort((a, b) => b.lastActivityAtMs - a.lastActivityAtMs);

  return {
    hot: mapped.filter((m) => m.kind === "hot"),
    revision: mapped.filter((m) => m.kind === "revision"),
    total: mapped.length,
  };
}
