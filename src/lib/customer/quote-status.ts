import type { QuoteStatus } from "@prisma/client";

// Müşteriye dönük teklif durumu etiketleri (admin tarafından farklı).
export const MY_QUOTE_STATUS: Record<
  QuoteStatus,
  { label: string; kind: "new" | "ready" | "closed" }
> = {
  NEW: { label: "İnceleniyor", kind: "new" },
  QUOTED: { label: "Teklif hazır", kind: "ready" },
  VIEWED: { label: "Teklif hazır", kind: "ready" },
  APPROVED: { label: "Onaylandı", kind: "ready" },
  REVISION_REQUESTED: { label: "Revizyon istendi", kind: "new" },
  DECLINED: { label: "Kapandı", kind: "closed" },
  EXPIRED: { label: "Süresi doldu", kind: "closed" },
  CLOSED: { label: "Kapandı", kind: "closed" },
};
