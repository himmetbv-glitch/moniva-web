import type { SectionType } from "@prisma/client";
import type { SeedSection } from "./home-sections";

export type Stat = { v: string; l: string };

export type AboutHeroData = {
  crumbLabel: string;
};

export type AboutFacilityData = {
  image: string;
  caption: string;
  eyebrow: string;
  title: string;
  body: string;
  stats: Stat[];
};

export type MvColumn = { tag: string; title: string; body: string };
export type AboutMvData = { columns: MvColumn[] };

export type TimelineEntry = { year: string; title: string; body: string };
export type AboutTimelineData = {
  eyebrow: string;
  title: string;
  entries: TimelineEntry[];
};

export type Cert = { code: string; body: string };
export type AboutCertsData = {
  eyebrow: string;
  title: string;
  certs: Cert[];
};

export type AboutContact = { icon: string; label: string; value: string };
export type AboutCtaData = {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  contacts: AboutContact[];
};

export const ABOUT_PAGE = {
  key: "about",
  title: "Hakkımızda",
  path: "/hakkinda",
  seoTitle: "Hakkımızda — Moniva",
  seoDesc:
    "1999'dan bu yana Moniva, ağır vasıta ve treyler sektöründe OEM kalitesinde yedek parçayı Konya'daki merkezinden 50+ pazara tedarik ediyor.",
} as const;

const _typeCheck: SectionType[] = [
  "ABOUT_HERO",
  "ABOUT_FACILITY",
  "ABOUT_MV",
  "ABOUT_TIMELINE",
  "ABOUT_CERTS",
  "ABOUT_CTA",
];
void _typeCheck;

export const ABOUT_SECTIONS: SeedSection[] = [
  {
    key: "hero",
    type: "ABOUT_HERO",
    name: "Breadcrumb",
    kind: "Üst Gezinme",
    sub: "Ana Sayfa / Hakkımızda",
    order: 1,
    visible: true,
    data: {
      crumbLabel: "Hakkımızda",
    } satisfies AboutHeroData,
  },
  {
    key: "facility",
    type: "ABOUT_FACILITY",
    name: "Tesis Bandı",
    kind: "Görsel + Metin",
    sub: "Tesis görseli + açıklama + 3 istatistik",
    order: 2,
    visible: true,
    data: {
      image: "/home/factory.jpg",
      caption: "KONYA GENEL MERKEZ · SELÇUKLU",
      eyebrow: "Moniva'nın İçinde",
      title: "Tek tesis. Uçtan uca kontrol.",
      body: "Konya Selçuklu'daki 12.000 m² depomuz, sekiz otomatik toplama hattında 50.000'den fazla ürün barındırır. Kalite kontrol, paketleme ve sevkiyat tek çatı altında gerçekleşir — böylece stoklu parçaların %92'sinde 24 saat içinde sevkiyat garantisi verebiliyoruz.",
      stats: [
        { v: "12.000 m²", l: "Depo alanı" },
        { v: "8", l: "Otomatik toplama hattı" },
        { v: "50.000+", l: "Ürün (SKU)" },
      ],
    } satisfies AboutFacilityData,
  },
  {
    key: "mv",
    type: "ABOUT_MV",
    name: "Misyon & Vizyon",
    kind: "İki Sütun",
    sub: "Misyon + Vizyon",
    order: 3,
    visible: true,
    data: {
      columns: [
        {
          tag: "Misyon",
          title: "Dünyanın ticari filolarını hareket halinde tutmak.",
          body: "Doğru parçayı, doğru şekilde tedarik eder, stoklar ve sevk ederiz. OEM üreticileriyle onlara bağımlı servisler arasında köprü kurar; tekliften sevkiyata kadar her adımdaki sürtünmeyi ortadan kaldırırız.",
        },
        {
          tag: "Vizyon",
          title: "Ağır vasıta yedek parçada referans isim.",
          body: "2030'a kadar Moniva; Avrupa, Orta Doğu, Orta Asya ve Kuzey Afrika genelinde doğrulanmış yedek parça için ilk akla gelen isim olacak — teknik derinlik ve 24 saatlik güvenilirlikle anılarak.",
        },
      ],
    } satisfies AboutMvData,
  },
  {
    key: "timeline",
    type: "ABOUT_TIMELINE",
    name: "Zaman Çizelgesi",
    kind: "Kilometre Taşları",
    sub: "Yıl bazlı kilometre taşları",
    order: 4,
    visible: true,
    data: {
      eyebrow: "Kilometre Taşları",
      title: "Yolda 27 yıl.",
      entries: [
        { year: "1999", title: "Konya'da kuruldu", body: "Türk treyler üreticileri için fren komponenti distribütörü olarak yola çıktı." },
        { year: "2006", title: "İlk ihracat sözleşmesi", body: "Alman filo işletmecisiyle uzun vadeli tedarik anlaşması imzalandı." },
        { year: "2012", title: "Depo genişlemesi", body: "Tam otomatik toplama hatlarına sahip 12.000 m² tesise taşındı." },
        { year: "2018", title: "ISO 9001:2015", body: "Kalite sistemleri yeniden sertifikalandı. Tüm ürünlerde tam izlenebilirlik." },
        { year: "2021", title: "50.000 ürüne ulaştı", body: "Hava süspansiyon ve elektrik grupları eklendi — tüm büyük kamyon OEM'leri kapsandı." },
        { year: "2026", title: "50+ pazarda", body: "Yetkili distribütör ağı artık üç kıtaya yayıldı." },
      ],
    } satisfies AboutTimelineData,
  },
  {
    key: "certs",
    type: "ABOUT_CERTS",
    name: "Sertifikalar",
    kind: "Kalite & Uyumluluk",
    sub: "Sertifika kartları",
    order: 5,
    visible: true,
    data: {
      eyebrow: "Kalite & Uyumluluk",
      title: "Uluslararası standartlarda sertifikalı.",
      certs: [
        { code: "ISO 9001:2015", body: "Tedarik, depolama ve sevkiyat operasyonlarında sertifikalı kalite yönetim sistemi." },
        { code: "EAC", body: "Avrasya Gümrük Birliği (Rusya, Belarus, Kazakistan) uygunluk sertifikası." },
      ],
    } satisfies AboutCertsData,
  },
  {
    key: "cta",
    type: "ABOUT_CTA",
    name: "İletişim CTA",
    kind: "Koyu CTA Bandı",
    sub: "Başlık + butonlar + iletişim",
    order: 6,
    visible: true,
    data: {
      eyebrow: "İletişime Geçin",
      title: "Konya'da bizi ziyaret edin ya da ihracat ekibimizle görüşün.",
      body: "Filo işletmecilerini ve distribütörleri her hafta Konya tesisimizde ağırlıyoruz. Bize yazın — sizin için bir tesis turu ayarlayalım.",
      primaryLabel: "Ürünleri Keşfet ▶",
      primaryHref: "/urunler",
      secondaryLabel: "İhracat Ekibine Yazın",
      secondaryHref: "mailto:info@moniva.com.tr",
      contacts: [
        { icon: "✉", label: "E-posta", value: "info@moniva.com.tr" },
        { icon: "✆", label: "Telefon", value: "+90 332 239 03 05" },
        { icon: "◎", label: "Konum", value: "Konya, Türkiye" },
      ],
    } satisfies AboutCtaData,
  },
];
