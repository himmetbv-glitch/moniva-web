import type { QuoteStatus } from "@prisma/client";

// Müşteriye dönük teklif durumu → sadece görsel "kind" burada; metin
// artık messages/*.json'daki `quote.status.*` altında (t() ile çekilir).
export type QuoteStatusKind = "new" | "ready" | "closed";

export const MY_QUOTE_KIND: Record<QuoteStatus, QuoteStatusKind> = {
  NEW: "new",
  QUOTED: "ready",
  VIEWED: "ready",
  APPROVED: "ready",
  REVISION_REQUESTED: "new",
  DECLINED: "closed",
  EXPIRED: "closed",
  CLOSED: "closed",
};

// QuoteStatus enum → messages key haritası
export const MY_QUOTE_KEY: Record<QuoteStatus, string> = {
  NEW: "new",
  QUOTED: "quoted",
  VIEWED: "viewed",
  APPROVED: "approved",
  REVISION_REQUESTED: "revisionRequested",
  DECLINED: "declined",
  EXPIRED: "expired",
  CLOSED: "closed",
};
