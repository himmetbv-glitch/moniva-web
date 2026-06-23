import type { QuoteStatus } from "@prisma/client";

// Müşteriye dönük teklif durumu etiketleri (admin tarafından farklı).
export const MY_QUOTE_STATUS: Record<
  QuoteStatus,
  { label: string; kind: "new" | "ready" | "closed" }
> = {
  NEW: { label: "İnceleniyor", kind: "new" },
  QUOTED: { label: "Teklif hazır", kind: "ready" },
  CLOSED: { label: "Kapandı", kind: "closed" },
};
