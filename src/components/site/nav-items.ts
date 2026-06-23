// Site üst menüsü — desktop satırı (SiteNav) ve mobil hamburger (HeaderMenu) ortak kullanır.
// "ready" olmayan sayfalar henüz kurulmadı → 404 vermemek için pasif (span).
export const NAV_ITEMS = [
  { label: "ANA SAYFA", href: "/", ready: true },
  { label: "HAKKIMIZDA", href: "/hakkinda", ready: true },
  { label: "ÜRÜNLER", href: "/urunler", ready: true },
  { label: "KATALOGLAR", href: "/kataloglar", ready: true },
  { label: "KALİTE", href: "/kalite", ready: true },
  { label: "HABERLER", href: "/haberler", ready: true },
  { label: "KARİYER", href: "/kariyer", ready: true },
  { label: "İLETİŞİM", href: "/iletisim", ready: true },
] as const;
