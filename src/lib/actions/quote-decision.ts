"use server";

import { revalidatePath } from "next/cache";
import { QuoteEventType, QuoteStatus } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/quotes/request-meta";

export type QuoteDecision = "approve" | "revision" | "contact" | "decline";

export type DecisionResult =
  | { ok: true; status: QuoteStatus; terminal: boolean; already: boolean }
  | { ok: false; error: string };

const baseSchema = z.object({
  decision: z.enum(["approve", "revision", "contact", "decline"]),
  note: z.string().trim().max(1000).optional().default(""),
});

const tokenSchema = baseSchema.extend({
  token: z.string().trim().min(8).max(64),
});

const mineSchema = baseSchema.extend({
  quoteRequestId: z.string().trim().min(1).max(64),
});

const MAP: Record<
  QuoteDecision,
  { event: QuoteEventType; status: QuoteStatus | null; terminal: boolean }
> = {
  approve: { event: QuoteEventType.DECISION_APPROVE, status: QuoteStatus.APPROVED, terminal: true },
  revision: { event: QuoteEventType.DECISION_REVISION, status: QuoteStatus.REVISION_REQUESTED, terminal: true },
  decline: { event: QuoteEventType.DECISION_DECLINE, status: QuoteStatus.DECLINED, terminal: true },
  contact: { event: QuoteEventType.DECISION_CONTACT, status: null, terminal: false },
};

const TERMINAL = new Set<QuoteStatus>([
  QuoteStatus.APPROVED,
  QuoteStatus.REVISION_REQUESTED,
  QuoteStatus.DECLINED,
]);

type QuoteForDecision = {
  id: string;
  status: QuoteStatus;
  validUntil: Date | null;
  firstViewedAt: Date | null;
};

// Karar uygulama çekirdeği — hem public token hem giriş yapmış müşteri kullanır.
async function applyQuoteDecision(
  quote: QuoteForDecision,
  decision: QuoteDecision,
  note: string,
  extraRevalidate: string[],
): Promise<DecisionResult> {
  // Süresi dolmuş teklifte karar alınamaz.
  if (quote.validUntil && quote.validUntil.getTime() < Date.now()) {
    return { ok: false, error: "Bu teklifin geçerlilik süresi doldu." };
  }

  // Idempotent: zaten sonuçlanmış bir teklifte tekrar karar kaydetme.
  if (TERMINAL.has(quote.status)) {
    return { ok: true, status: quote.status, terminal: true, already: true };
  }

  const m = MAP[decision];
  const { device, ipHash } = await getRequestMeta();
  const now = new Date();

  // "Görüş" kararı durumu terminal yapmaz; ama etkileşim QUOTED'ı VIEWED'a taşır.
  const nextStatus =
    m.status ??
    (quote.status === QuoteStatus.QUOTED ? QuoteStatus.VIEWED : quote.status);

  await prisma.$transaction([
    prisma.quoteEvent.create({
      data: {
        quoteRequestId: quote.id,
        type: m.event,
        device,
        ipHash,
        note: note || null,
      },
    }),
    prisma.quoteRequest.update({
      where: { id: quote.id },
      data: {
        status: nextStatus,
        // Panelden karar veren müşteri linki hiç açmamış olabilir — funnel tutarlılığı.
        ...(quote.firstViewedAt ? {} : { firstViewedAt: now, lastViewedAt: now }),
      },
    }),
  ]);

  for (const p of extraRevalidate) revalidatePath(p);
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${quote.id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/follow-ups");

  return {
    ok: true,
    status: nextStatus,
    terminal: m.terminal,
    already: false,
  };
}

// Public izlenebilir link üzerinden karar (auth YOK — token yetkidir).
export async function submitQuoteDecision(
  input: z.input<typeof tokenSchema>,
): Promise<DecisionResult> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  const { token, decision, note } = parsed.data;

  const quote = await prisma.quoteRequest.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, validUntil: true, firstViewedAt: true },
  });
  if (!quote) return { ok: false, error: "Teklif bulunamadı." };

  return applyQuoteDecision(quote, decision, note, [`/teklif/${token}`]);
}

// Giriş yapmış müşteri, Hesabım panelinden karar verir (sahiplik zorunlu).
export async function submitMyQuoteDecision(
  input: z.input<typeof mineSchema>,
): Promise<DecisionResult> {
  const parsed = mineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  const { quoteRequestId, decision, note } = parsed.data;

  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
  }

  // Sahiplik: yalnız kendi teklifi (yetki sızıntısı engeli).
  const quote = await prisma.quoteRequest.findFirst({
    where: { id: quoteRequestId, userId: session.user.id },
    select: { id: true, status: true, validUntil: true, firstViewedAt: true },
  });
  if (!quote) return { ok: false, error: "Teklif bulunamadı." };

  // Henüz fiyatlanmamış (NEW) teklifte karar verilemez.
  if (quote.status === QuoteStatus.NEW) {
    return { ok: false, error: "Bu teklif henüz fiyatlandırılmadı." };
  }

  return applyQuoteDecision(quote, decision, note, [
    `/hesabim/teklifler/${quoteRequestId}`,
    "/hesabim",
  ]);
}
