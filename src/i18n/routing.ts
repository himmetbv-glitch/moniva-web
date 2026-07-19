import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "ru", "ar"] as const,
  defaultLocale: "tr",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export const RTL_LOCALES: readonly AppLocale[] = ["ar"];
export const isRtl = (locale: AppLocale) => RTL_LOCALES.includes(locale);
