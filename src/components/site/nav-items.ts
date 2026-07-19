// Site üst menüsü — SiteNav (desktop) ve HeaderMenu (mobil) ortak kullanır.
// Label metni t(`nav.${key}`) ile çevrilir; burada sadece rota + hazır durumu.
export type NavKey =
  | "home"
  | "about"
  | "products"
  | "catalogs"
  | "quality"
  | "news"
  | "careers"
  | "contact";

export const NAV_ITEMS: readonly { key: NavKey; href: string; ready: boolean }[] = [
  { key: "home", href: "/", ready: true },
  { key: "about", href: "/hakkinda", ready: true },
  { key: "products", href: "/urunler", ready: true },
  { key: "catalogs", href: "/kataloglar", ready: true },
  { key: "quality", href: "/kalite", ready: true },
  { key: "news", href: "/haberler", ready: true },
  { key: "careers", href: "/kariyer", ready: true },
  { key: "contact", href: "/iletisim", ready: true },
];
