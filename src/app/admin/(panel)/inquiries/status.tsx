import { QuoteStatus } from "@prisma/client";

import type { InquiryPriority } from "@/lib/admin/inquiries";

export const STATUS_PILL: Record<QuoteStatus, { kind: string; label: string }> = {
  NEW: { kind: "info", label: "Yeni" },
  QUOTED: { kind: "mute", label: "Teklif verildi" },
  VIEWED: { kind: "info", label: "Görüntülendi" },
  APPROVED: { kind: "ok", label: "Onaylandı" },
  REVISION_REQUESTED: { kind: "warn", label: "Revizyon istendi" },
  DECLINED: { kind: "err", label: "Uygun değil" },
  EXPIRED: { kind: "mute", label: "Süresi doldu" },
  CLOSED: { kind: "ok", label: "Kapandı" },
};

export const PRIORITY: Record<InquiryPriority, string> = {
  high: "Yüksek",
  med: "Orta",
  low: "Düşük",
};

// Durum akışı (stepper) — gerçek 3 duruma eşlenir.
export const STATUS_FLOW: { key: QuoteStatus; label: string }[] = [
  { key: QuoteStatus.NEW, label: "Yeni" },
  { key: QuoteStatus.QUOTED, label: "Teklif Verildi" },
  { key: QuoteStatus.CLOSED, label: "Kapandı" },
];
