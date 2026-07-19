// Dil seçenekleri — üst bar LangSwitcher (desktop) ve mobil hamburger menü ortak kullanır.
// code lower-case: routing.locales ile uyumlu.
export const LANGS = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];
