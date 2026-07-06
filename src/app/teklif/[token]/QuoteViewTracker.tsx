"use client";

import { useEffect, useRef } from "react";

import { trackQuoteView } from "@/lib/actions/quote-tracking";

/** Sayfa açılınca bir kez görüntülenme kaydı düşer (StrictMode'da tek atış). */
export function QuoteViewTracker({ token }: { token: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackQuoteView(token).catch(() => {});
  }, [token]);
  return null;
}
