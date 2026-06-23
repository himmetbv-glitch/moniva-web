import { Locale } from "@prisma/client";

export const LOCALES = ["TR", "EN", "RU", "AR"] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = "TR";
export const FALLBACK_LOCALE: Locale = "EN";

export const RTL_LOCALES: readonly Locale[] = ["AR"];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Picks the translation for the requested locale, falling back to English,
 * then to whatever exists. Mirrors the design's "missing translations fall
 * back to English" rule.
 */
export function pickTranslation<T extends { locale: Locale }>(
  translations: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === FALLBACK_LOCALE) ??
    translations[0]
  );
}
