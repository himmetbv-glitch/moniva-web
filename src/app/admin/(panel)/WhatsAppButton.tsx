"use client";

import {
  buildWhatsAppMessage,
  normalizePhone,
  waHref,
  type WaScenario,
} from "@/lib/quotes/whatsapp";

export function WhatsAppButton({
  phone,
  token,
  scenario,
  greetName,
  refLabel,
  validUntilLabel,
  variant = "compact",
}: {
  phone: string | null;
  token: string | null;
  scenario: WaScenario;
  greetName: string;
  refLabel: string;
  validUntilLabel?: string | null;
  variant?: "compact" | "full";
}) {
  const normalized = normalizePhone(phone);
  const cls = "wa-btn" + (variant === "full" ? " wa-btn--full" : "");

  function open() {
    if (!normalized) return;
    const link =
      token != null ? `${window.location.origin}/teklif/${token}` : null;
    const message = buildWhatsAppMessage({
      scenario,
      greetName,
      ref: refLabel,
      link,
      validUntilLabel,
    });
    window.open(waHref(normalized, message), "_blank", "noopener,noreferrer");
  }

  if (!normalized) {
    return (
      <span className={`${cls} wa-btn--off`} title="Müşteri telefonu yok">
        <Glyph /> WhatsApp
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      onClick={open}
      title="Hazır mesajla WhatsApp'ta aç"
    >
      <Glyph /> WhatsApp
    </button>
  );
}

function Glyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.82c2.17 0 4.21.85 5.75 2.38a8.06 8.06 0 0 1 2.38 5.72c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.25-8.23Zm-4.7 4.36c-.22 0-.58.08-.88.41-.3.33-1.16 1.13-1.16 2.76 0 1.63 1.18 3.2 1.35 3.42.17.22 2.32 3.54 5.63 4.83 2.75 1.08 3.31.87 3.91.81.6-.05 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.13-.3-.22-.63-.38-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.74.16-.22.33-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.38-.51-2.63-1.62-.97-.87-1.63-1.94-1.82-2.27-.19-.33-.02-.5.15-.66.15-.15.33-.38.49-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.72-1.79-1.02-2.45-.24-.56-.49-.57-.72-.58-.19-.01-.41-.01-.63-.01Z" />
    </svg>
  );
}
