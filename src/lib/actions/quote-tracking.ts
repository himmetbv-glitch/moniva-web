"use server";

import { QuoteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/quotes/request-meta";

/**
 * Public teklif sayfası açıldığında çağrılır (client tracker → server action).
 * LINK_OPENED event'i kaydeder, viewCount artırır, ilk/son görüntülenme
 * zamanını günceller, QUOTED durumundaysa VIEWED'a çeker.
 */
export async function trackQuoteView(token: string): Promise<void> {
  if (!token) return;

  const quote = await prisma.quoteRequest.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, firstViewedAt: true },
  });
  if (!quote) return;

  const { device, ipHash } = await getRequestMeta();
  const now = new Date();

  await prisma.$transaction([
    prisma.quoteEvent.create({
      data: { quoteRequestId: quote.id, type: "LINK_OPENED", device, ipHash },
    }),
    prisma.quoteRequest.update({
      where: { id: quote.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: now,
        ...(quote.firstViewedAt ? {} : { firstViewedAt: now }),
        ...(quote.status === QuoteStatus.QUOTED
          ? { status: QuoteStatus.VIEWED }
          : {}),
      },
    }),
  ]);
}
