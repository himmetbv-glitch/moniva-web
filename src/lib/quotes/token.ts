import "server-only";

import { randomBytes } from "node:crypto";

/** Tahmin edilemez, URL-güvenli teklif token'ı (24 karakter). */
export function generateQuoteToken(): string {
  return randomBytes(18).toString("base64url");
}
