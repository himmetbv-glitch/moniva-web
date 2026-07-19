import { Locale } from "@prisma/client";

import { DEFAULT_LOCALE } from "./i18n";

/**
 * next-intl locale (lowercase: "tr"/"en"/"ru"/"ar") →
 * Prisma Locale enum (uppercase: TR/EN/RU/AR).
 * Bilinmeyen giriş TR fallback.
 */
export function toDbLocale(locale: string | undefined | null): Locale {
  if (!locale) return DEFAULT_LOCALE;
  const up = locale.toUpperCase();
  if (up === "TR" || up === "EN" || up === "RU" || up === "AR") {
    return up as Locale;
  }
  return DEFAULT_LOCALE;
}
