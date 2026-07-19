import type { SeedSection } from "./home-sections";

export type CatalogBannerData = {
  crumbLabel: string;
  kicker: string;
  title: string;
  subtitle: string;
  statProduct: string;
  statFamily: string;
  statBrand: string;
};

export type CatalogCardData = {
  quoteText: string;
  addLabel: string;
  addedLabel: string;
};

export type ProductDetailRow = { label: string; value: string };
export type ProductDetailData = {
  quickHeading: string;
  rows: ProductDetailRow[];
  descHeading: string;
  specsHeading: string;
  docsHeading: string;
  relatedHeading: string;
  addLabel: string;
  addedLabel: string;
};

export const CATALOG_PAGE = {
  key: "catalog",
  title: "Katalog (Ürünler & Detay)",
  path: "/urunler",
  seoTitle: "Ürünler — Moniva",
  seoDesc:
    "Kamyon, treyler ve ticari araçlar için OEM ve aftermarket yedek parça kataloğu.",
} as const;

export const CATALOG_SECTIONS: SeedSection[] = [
  {
    key: "banner",
    type: "CATALOG_BANNER",
    name: "Katalog Banner",
    kind: "Ürünler sayfası başlığı",
    sub: "Başlık + alt metin + istatistik etiketleri (sayılar otomatik)",
    order: 1,
    visible: true,
    data: {
      crumbLabel: "Ürünler",
      kicker: "",
      title: "Ürünler.",
      subtitle:
        "Kamyon, treyler ve ticari araçlar için OEM ve aftermarket yedek parçalar. Fiyat gösterilmez — ürünleri teklif listenize ekleyin, uzman ekibimiz 24 saat içinde size özel fiyatla döner.",
      statProduct: "Ürün",
      statFamily: "Aile",
      statBrand: "Marka",
    } satisfies CatalogBannerData,
  },
  {
    key: "card",
    type: "CATALOG_CARD",
    name: "Ürün Kartı",
    kind: "Liste kartı metinleri",
    sub: "Kartlardaki teklif metinleri",
    order: 2,
    visible: true,
    data: {
      quoteText: "Fiyat için teklif alın",
      addLabel: "Teklif Listeme Ekle",
      addedLabel: "Eklendi",
    } satisfies CatalogCardData,
  },
  {
    key: "detail",
    type: "PRODUCT_DETAIL",
    name: "Ürün Detay",
    kind: "Detay sayfası metinleri",
    sub: "Hızlı Bilgi kutusu + bölüm başlıkları",
    order: 3,
    visible: true,
    data: {
      quickHeading: "Hızlı Bilgi",
      rows: [
        { label: "Ort. sevkiyat", value: "24 saat" },
        { label: "Min. sipariş", value: "1 adet" },
        { label: "Menşe", value: "Konya, TR" },
      ],
      descHeading: "Ürün Açıklaması",
      specsHeading: "Teknik Özellikler",
      docsHeading: "Dokümanlar",
      relatedHeading: "Benzer Ürünler",
      addLabel: "Teklif Listeme Ekle",
      addedLabel: "Eklendi",
    } satisfies ProductDetailData,
  },
];
