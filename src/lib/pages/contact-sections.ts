import type { SeedSection } from "./home-sections";

export type Stat = { v: string; l: string };

export type ContactHeroData = {
  crumbLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  stats: Stat[];
};

export type ContactInfoData = {
  eyebrow: string;
  companyName: string; // \n ile satır
  addressLabel: string;
  addressLines: string[];
  phoneLabel: string;
  emailLabel: string;
  hoursLabel: string;
  hoursLines: string[];
};

// valueType: "email" | "phone" | "custom" (email/phone Ayarlar'dan gelir)
export type QuickTile = {
  icon: string;
  label: string;
  valueType: string;
  valueCustom: string;
  sub: string;
};
export type ContactQuickData = { tiles: QuickTile[] };

export type ContactLocData = {
  eyebrow: string;
  title: string;
  body: string;
  directionsHref: string;
  mapHref: string;
  mapSrc: string;
  cardTitle: string;
  cardLocation: string;
  cardAddressLines: string[];
  coordLat: string;
  coordLng: string;
};

// email/phone boş bırakılırsa Ayarlar'daki genel iletişim bilgisi gösterilir.
export type Dept = {
  name: string;
  contact: string;
  hours: string;
  email?: string;
  phone?: string;
};
export type ContactDeptsData = {
  eyebrow: string;
  title: string;
  depts: Dept[];
};

export const CONTACT_PAGE = {
  key: "contact",
  title: "İletişim",
  path: "/iletisim",
  seoTitle: "İletişim — Moniva",
  seoDesc:
    "Moniva ekibiyle iletişime geçin. Teklif, teknik destek veya distribütörlük için çalışma saatleri içinde ortalama 4 saatte dönüş.",
} as const;

export const CONTACT_SECTIONS: SeedSection[] = [
  {
    key: "hero",
    type: "CONTACT_HERO",
    name: "Hero",
    kind: "Başlık + İstatistik",
    sub: "Breadcrumb + başlık + istatistik",
    order: 1,
    visible: true,
    data: {
      crumbLabel: "İletişim",
      eyebrow: "İletişime Geçin",
      title: "Ekibimizle konuşun.",
      lead: "Teklif, teknik destek ya da distribütör olmak isteyin — ekibimiz Pazartesi'den Cuma'ya 4 iş saati içinde dönüş yapar.",
      stats: [
        { v: "4 sa", l: "Ort. yanıt süresi" },
        { v: "3", l: "Desteklenen dil" },
      ],
    } satisfies ContactHeroData,
  },
  {
    key: "info",
    type: "CONTACT_INFO",
    name: "İletişim Bilgileri",
    kind: "Genel Merkez Paneli",
    sub: "Adres / telefon / e-posta / saatler (telefon+e-posta Ayarlar'dan)",
    order: 2,
    visible: true,
    data: {
      eyebrow: "Genel Merkez",
      companyName: "MONIVA Otomotiv ve Gıda\nSan. Tic. A.Ş.",
      addressLabel: "Adres",
      addressLines: ["Konya Organize Sanayi Bölgesi", "Küçükıldız Sokak No:6 PK.42050", "Selçuklu / Konya, TÜRKİYE"],
      phoneLabel: "Telefon",
      emailLabel: "E-posta",
      hoursLabel: "Çalışma saatleri",
      hoursLines: ["Pazartesi – Cuma: 08:00 – 18:00", "Cumartesi: 09:00 – 14:00", "Pazar: Kapalı"],
    } satisfies ContactInfoData,
  },
  {
    key: "quick",
    type: "CONTACT_QUICK",
    name: "Hızlı İletişim",
    kind: "Kart Dörtlüsü",
    sub: "4 hızlı erişim kartı",
    order: 3,
    visible: true,
    data: {
      tiles: [
        { icon: "✉", label: "E-posta", valueType: "email", valueCustom: "", sub: "Teklif & sipariş için" },
        { icon: "✆", label: "Bizi arayın", valueType: "phone", valueCustom: "", sub: "Pzt–Cum 08:00–18:00" },
        { icon: "◎", label: "Ziyaret edin", valueType: "custom", valueCustom: "Konya, Türkiye", sub: "Randevu ile" },
        { icon: "⚙", label: "Teknik destek", valueType: "email", valueCustom: "", sub: "OEM çapraz referans" },
      ],
    } satisfies ContactQuickData,
  },
  {
    key: "loc",
    type: "CONTACT_LOC",
    name: "Konum",
    kind: "Harita + Kart",
    sub: "Harita + adres kartı",
    order: 4,
    visible: true,
    data: {
      eyebrow: "Bizi Bulun",
      title: "Konya Organize Sanayi Bölgesi",
      body: "Konya Havalimanı'na 45 dakika · O-21 otoyolu üzerinden doğrudan lojistik erişim · Orta Anadolu'nun en büyük organize sanayi bölgesi.",
      directionsHref: "https://www.google.com/maps/dir/?api=1&destination=37.952,32.500",
      mapHref: "https://www.openstreetmap.org/?mlat=37.952&mlon=32.500#map=14/37.952/32.500",
      mapSrc: "https://www.openstreetmap.org/export/embed.html?bbox=32.46%2C37.93%2C32.54%2C37.97&layer=mapnik&marker=37.952%2C32.500",
      cardTitle: "MONIVA GM",
      cardLocation: "Konya, Türkiye",
      cardAddressLines: ["Konya Organize Sanayi Bölgesi", "Küçükıldız Sokak No:6 PK.42050", "Selçuklu / Konya, TÜRKİYE"],
      coordLat: "37.952° K",
      coordLng: "32.500° D",
    } satisfies ContactLocData,
  },
  {
    key: "depts",
    type: "CONTACT_DEPTS",
    name: "Departmanlar",
    kind: "Doğrudan Hatlar",
    sub: "Departman kartları (telefon+e-posta Ayarlar'dan)",
    order: 5,
    visible: true,
    data: {
      eyebrow: "Doğrudan Hatlar",
      title: "Doğru ekibe ulaşın.",
      depts: [
        { name: "İhracat — Avrupa", contact: "İhracat Ekibi", hours: "Pzt–Cum 08:00–18:00 CET" },
        { name: "İhracat — Doğu Pazarları", contact: "İhracat Ekibi", hours: "Pzt–Cum 09:00–18:00 MSK" },
        { name: "Teknik Destek", contact: "Teknik Ekip", hours: "Pzt–Cum 08:00–17:00" },
        { name: "Basın & Medya", contact: "Kurumsal İletişim", hours: "Pzt–Cum 09:00–17:00" },
      ],
    } satisfies ContactDeptsData,
  },
];
