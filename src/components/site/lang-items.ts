// Dil seçenekleri — üst bar LangSwitcher (desktop) ve mobil hamburger menü ortak kullanır.
// NOT: Tam i18n yönlendirmesi sonraya. Şu an yalnız TR aktif; diğerleri "yakında".
export const LANGS = [
  { code: "TR", label: "Türkçe", ready: true },
  { code: "EN", label: "English", ready: false },
  { code: "RU", label: "Русский", ready: false },
  { code: "AR", label: "العربية", ready: false },
] as const;

export const ACTIVE_LANG = "TR"; // i18n gelene kadar sabit
