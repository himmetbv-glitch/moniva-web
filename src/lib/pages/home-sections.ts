import type { SectionType } from "@prisma/client";

// Bölüm içerik şekilleri — render + editör + seed tek kaynaktan kullanır.
// (Bu dosya framework-agnostik: prisma/seed tsx ile de import eder.)

export type CtaLink = { label: string; href: string };

export type HeroSlide = { img: string; head: string; sub: string };
export type HeroData = {
  slides: HeroSlide[];
  ctaPrimary: CtaLink;
  ctaSecondary: CtaLink;
};

export type CategoryTile = { categorySlug: string; image: string };
export type CategoryGridData = {
  title: string;
  ruleWidth: number;
  ctaLabel: string;
  ctaHref: string;
  tiles: CategoryTile[]; // boş → otomatik ilk kategoriler
};

export type Pillar = { num: string; title: string; body: string };
export type FeatureColumnsData = {
  title: string;
  ruleWidth: number;
  pillars: Pillar[];
};

export type Region = { region: string; countries: string; count: number };
export type Stat = { v: string; l: string };
export type RegionGridData = {
  title: string;
  ruleWidth: number;
  regions: Region[];
  stats: Stat[];
  mapImage: string;
  cardHead: string;
  cardSub: string;
  cardHref: string;
};

export type FeaturedProductsData = {
  title: string;
  ruleWidth: number;
  ctaLabel: string;
  ctaHref: string;
  // Elle seçilen öne çıkan ürünler (Product.id, sırayla). Boşsa otomatik (isFeatured).
  productIds: string[];
};

export type NewsroomData = {
  title: string;
  ruleWidth: number;
  sideTitle: string;
  sideRuleWidth: number;
};

export type PartnerMarqueeData = { brands: string[] };

export type Contact = { icon: string; label: string; value: string };
export type ContactCtaData = {
  kicker: string;
  head: string;
  sub: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  contacts: Contact[];
};

// İçeriği tamamen otomatik (DB'den) gelen bölümler — editörde sadece başlık + görünürlük.
export const DYNAMIC_SECTION_TYPES: SectionType[] = [
  "FEATURED_PRODUCTS",
  "NEWSROOM",
];

export function isDynamicSection(type: SectionType): boolean {
  return DYNAMIC_SECTION_TYPES.includes(type);
}

export type SeedSection = {
  key: string;
  type: SectionType;
  name: string;
  kind: string;
  sub: string;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
};

export const HOME_PAGE = {
  key: "home",
  title: "Anasayfa",
  path: "/",
  seoTitle: "Moniva — Kamyon ve Treyler Yedek Parça",
  seoDesc:
    "Kamyon, treyler ve ticari araçlar için premium yedek parça. OEM kalitesinde, 50.000+ SKU, 50+ ülkeye hızlı sevkiyat.",
} as const;

export const HOME_SECTIONS: SeedSection[] = [
  {
    key: "hero",
    type: "HERO",
    name: "Hero",
    kind: "Hero Carousel",
    sub: "3 slaytlı carousel — başlık + alt başlık",
    order: 1,
    visible: true,
    data: {
      slides: [
        {
          img: "/home/hero.jpg",
          head: "Güvenilir Parça. Global Erişim.",
          sub: "Kamyon, treyler ve ticari araçlar için premium yedek parça — rekabetçi fiyat ve Avrupa geneline hızlı sevkiyat.",
        },
        {
          img: "/home/factory.jpg",
          head: "Ağır Vasıta İçin Üretildi.",
          sub: "Süspansiyon körükleri, amortisörler ve seviye valfleri — dünyanın önde gelen OEM üreticilerinden.",
        },
        {
          img: "/home/trucks.png",
          head: "Binlerce Parça Numarası. Stokta.",
          sub: "Tüm büyük kamyon markaları için debriyaj, şanzıman ve aktarma organları. Sevke hazır.",
        },
      ],
      ctaPrimary: { label: "Ürünleri Keşfet", href: "/urunler" },
      ctaSecondary: { label: "Teklif Al", href: "/teklif-listem" },
    } satisfies HeroData,
  },
  {
    key: "categories",
    type: "CATEGORY_GRID",
    name: "Ürün Kategorileri",
    kind: "Görsel Kart Izgarası",
    sub: "Seçili kategori kartları",
    order: 2,
    visible: true,
    data: {
      title: "Ürün Kategorileri. Ana İş Kolumuz.",
      ruleWidth: 360,
      ctaLabel: "Tüm ürünleri gör ▶",
      ctaHref: "/urunler",
      tiles: [],
    } satisfies CategoryGridData,
  },
  {
    key: "why",
    type: "FEATURE_COLUMNS",
    name: "Neden Moniva",
    kind: "Özellik Sütunları",
    sub: "4 değer sütunu",
    order: 3,
    visible: true,
    data: {
      title: "Neden Moniva.",
      ruleWidth: 150,
      pillars: [
        {
          num: "01",
          title: "Teknik Uzmanlık.",
          body: "Filo işletmecilerine ve distribütörlere OEM kalitesinde parça tedariği. Teknik ekibimiz tüm büyük kamyon markaları için parça eşleştirme desteği sağlar.",
        },
        {
          num: "02",
          title: "Hızlı Global Sevkiyat.",
          body: "Konya'daki depomuzdan Avrupa ve Orta Doğu'ya doğrudan nakliye hatları. Ortalama sipariş-sevk süresi: 24 saat.",
        },
        {
          num: "03",
          title: "Doğrulanmış Kalite.",
          body: "ISO 9001:2015 sertifikalı. Tüm ürünler ECE / AB homologasyon gerekliliklerini karşılar. Her sevkiyatta tam izlenebilirlik.",
        },
        {
          num: "04",
          title: "Rekabetçi Fiyat.",
          body: "Önde gelen OEM ve aftermarket üreticileriyle doğrudan tedarik ilişkileri. Filo hesapları için hacim fiyatlandırması.",
        },
      ],
    } satisfies FeatureColumnsData,
  },
  {
    key: "reach",
    type: "REGION_GRID",
    name: "Global İhracat",
    kind: "Bölge Izgarası + Harita",
    sub: "6 bölge + istatistik + distribütör CTA",
    order: 4,
    visible: true,
    data: {
      title: "Global İhracat Ağı.",
      ruleWidth: 240,
      regions: [
        { region: "Batı Avrupa", countries: "DE · FR · NL · BE · AT · CH · IT · ES", count: 12 },
        { region: "Doğu Avrupa", countries: "PL · RO · CZ · HU · SK · BG · HR", count: 14 },
        { region: "Orta Doğu", countries: "TR · UAE · SA · JO · IQ · KW · QA", count: 11 },
        { region: "Kuzey Afrika", countries: "EG · MA · TN · LY · DZ", count: 8 },
        { region: "Orta Asya", countries: "KZ · AZ · GE · UZ · TM", count: 6 },
        { region: "Diğer Pazarlar", countries: "UK · İskandinavya · Baltıklar", count: 9 },
      ],
      stats: [
        { v: "50+", l: "İhracat Ülkesi" },
        { v: "50.000+", l: "Aktif SKU" },
        { v: "3", l: "Kıta" },
        { v: "24sa", l: "Ort. Sevkiyat" },
      ],
      mapImage: "/home/trucks.png",
      cardHead: "Yetkili Distribütör Olun.",
      cardSub: "Yeni pazarlarda distribütör arıyoruz. İhracat ekibimizle iletişime geçin. ▶",
      cardHref: "/teklif-listem",
    } satisfies RegionGridData,
  },
  {
    key: "featured",
    type: "FEATURED_PRODUCTS",
    name: "Öne Çıkan Ürünler",
    kind: "Öne Çıkanlar",
    sub: "1 büyük kart + liste — Ürünler modülünden otomatik",
    order: 5,
    visible: true,
    data: {
      title: "Öne Çıkan Ürünler.",
      ruleWidth: 220,
      ctaLabel: "Tüm katalog ▶",
      ctaHref: "/urunler",
      productIds: [],
    } satisfies FeaturedProductsData,
  },
  {
    key: "news",
    type: "NEWSROOM",
    name: "Newsroom",
    kind: "Haber Özeti",
    sub: "2 kart + son haberler — Newsroom'dan otomatik",
    order: 6,
    visible: true,
    data: {
      title: "Newsroom.",
      ruleWidth: 120,
      sideTitle: "Son Haberler.",
      sideRuleWidth: 140,
    } satisfies NewsroomData,
  },
  {
    key: "brands",
    type: "PARTNER_MARQUEE",
    name: "Partner Markalar",
    kind: "Marka Logo Şeridi",
    sub: "15 OEM partner — kayan şerit",
    order: 7,
    visible: true,
    data: {
      brands: [
        "KNORR-BREMSE", "WABCO", "HALDEX", "SAF-HOLLAND", "BPW", "MERITOR",
        "BENDIX", "FEBI BILSTEIN", "SKF", "BOSCH", "ZF", "CONTINENTAL",
        "HELLA", "GATES", "VALEO",
      ],
    } satisfies PartnerMarqueeData,
  },
  {
    key: "cta",
    type: "CONTACT_CTA",
    name: "İletişim CTA",
    kind: "Koyu CTA Bandı",
    sub: "Satış iletişim bandı",
    order: 8,
    visible: true,
    data: {
      kicker: "İletişime Geçin",
      head: "Premium kamyon ve treyler parçası tedariğine hazır mısınız?",
      sub: "Satış ekibimiz hafta içi 08:00–18:00 arası ulaşılabilir. Hızlı teklif, teknik destek, filo hesapları için hacim fiyatı.",
      primaryLabel: "Teklif Al ▶",
      primaryHref: "/teklif-listem",
      secondaryLabel: "Satışla İletişim",
      secondaryHref: "mailto:export@moniva.com.tr",
      contacts: [
        { icon: "✉", label: "E-posta", value: "export@moniva.com.tr" },
        { icon: "✆", label: "Telefon", value: "+90 332 239 03 05" },
        { icon: "◎", label: "Konum", value: "Konya, Türkiye" },
      ],
    } satisfies ContactCtaData,
  },
];
