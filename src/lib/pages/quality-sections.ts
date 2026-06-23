import type { SeedSection } from "./home-sections";

export type Stat = { v: string; l: string };

export type QualityBannerData = {
  crumbLabel: string;
  eyebrow: string;
  title: string;
  sub: string;
  stats: Stat[];
};

export type QualityMissionData = {
  title: string;
  ruleWidth: number;
  lead: string;
  body: string;
  image: string;
};

export type Standard = { code: string; year: string; org: string; scope: string };
export type QualityStandardsData = {
  title: string;
  ruleWidth: number;
  sub: string;
  standards: Standard[];
};

export type QualityDoc = {
  name: string;
  lang: string;
  type: string; // "pdf" | "img"
  size: string;
  flag: string;
  fileUrl?: string; // boşsa "Yakında", doluysa indirilebilir
};
export type QualityDocsData = {
  title: string;
  ruleWidth: number;
  sub: string;
  docs: QualityDoc[];
};

export const QUALITY_PAGE = {
  key: "quality",
  title: "Kalite",
  path: "/kalite",
  seoTitle: "Kalite & Sertifikalar — Moniva",
  seoDesc:
    "Her Moniva komponenti test edilmiş, denetlenmiş ve izlenebilir olarak sevk edilir. ISO 9001, IATF 16949, ECE R90 ve daha fazlası — küresel otomotiv standartlarında sertifikalı.",
} as const;

export const QUALITY_SECTIONS: SeedSection[] = [
  {
    key: "banner",
    type: "QUALITY_BANNER",
    name: "Banner",
    kind: "Başlık + İstatistik",
    sub: "Breadcrumb + başlık + 3 istatistik",
    order: 1,
    visible: true,
    data: {
      crumbLabel: "Kalite",
      eyebrow: "Kalite Güvencesi",
      title: "Kalite.",
      sub: "Her komponent tesisimizden test edilmiş, denetlenmiş ve izlenebilir olarak çıkar. 80+ pazarda güvenilirlik için tasarlanmış, küresel otomotiv standartlarında sertifikalı.",
      stats: [
        { v: "7", l: "Lab İstasyonu" },
        { v: "8", l: "Sertifika" },
        { v: "%100", l: "Test edildi" },
      ],
    } satisfies QualityBannerData,
  },
  {
    key: "mission",
    type: "QUALITY_MISSION",
    name: "Kalite Misyonu",
    kind: "Metin + Görsel",
    sub: "İki paragraf + görsel",
    order: 2,
    visible: true,
    data: {
      title: "Kalite Misyonumuz.",
      ruleWidth: 200,
      lead: "Moniva Otomotiv, ticari araçlar için servis fren körükleri, yaylı fren körükleri ve hava/hidrolik fren sistemleri üretiminde her hattaki kalite standardını sürekli yükselterek üretimine devam ediyor — dünya standartlarında ürünler geliştirmeye adanmış genç ve dinamik bir Ar-Ge ekibinin desteğiyle.",
      body: "Kendi lab istasyonlarımızın ötesinde, zorlu Kos ve Ozon dayanım protokolleri dahil tüm yaşlandırma testleri KOSGEB akrediteli laboratuvarlarda yürütülür; böylece sevk edilen her parça, Avrupa, Orta Doğu ve Avrasya pazarlarındaki müşterilerimizin güvendiği dayanıklılık profilini karşılar.",
      image: "/home/factory.jpg",
    } satisfies QualityMissionData,
  },
  {
    key: "standards",
    type: "QUALITY_STANDARDS",
    name: "Uluslararası Standartlar",
    kind: "Sertifika Izgarası",
    sub: "Standart kartları",
    order: 3,
    visible: true,
    data: {
      title: "Uluslararası Standartlar.",
      ruleWidth: 220,
      sub: "Otomotiv kalitesi, çevre ve bölgesel pazar girişini düzenleyen altı temel standartta bağımsız denetim ve sertifikasyon.",
      standards: [
        { code: "ISO 9001", year: "2015", org: "Uluslararası Standardizasyon Örgütü", scope: "Kalite Yönetim Sistemleri" },
        { code: "IATF 16949", year: "2016", org: "Uluslararası Otomotiv Görev Gücü", scope: "Otomotiv KYS — en üst kademe" },
        { code: "ECE R90", year: "Rev. 02", org: "BM Avrupa Ekonomik Komisyonu", scope: "Yedek Fren Balata Takımları" },
        { code: "CE İşareti", year: "AB 2024", org: "Avrupa Uygunluğu", scope: "AB direktiflerine uygunluk" },
        { code: "EAC", year: "TR-CU", org: "Avrasya Uygunluğu (RU/BY/KZ)", scope: "Gümrük Birliği onayı" },
        { code: "ISO 14001", year: "2015", org: "ISO Çevre", scope: "Çevre Yönetim Sistemi" },
      ],
    } satisfies QualityStandardsData,
  },
  {
    key: "docs",
    type: "QUALITY_DOCS",
    name: "Belgeler",
    kind: "Doküman Izgarası",
    sub: "İndirilebilir belge kartları",
    order: 4,
    visible: true,
    data: {
      title: "Belgeler.",
      ruleWidth: 130,
      sub: "İndirilebilir sertifikalar ve kurumsal Kalite Politikası — bölgesel satın alma ekipleri için çeşitli dillerde.",
      docs: [
        { name: "EAC Sertifikası — Bölüm 1", lang: "Avrasya Uygunluğu", type: "pdf", size: "1,4 MB", flag: "🇷🇺" },
        { name: "EAC Sertifikası — Bölüm 2", lang: "Avrasya Uygunluğu", type: "pdf", size: "1,2 MB", flag: "🇷🇺" },
        { name: "Kalite Politikası", lang: "Kurumsal Beyan", type: "pdf", size: "320 KB", flag: "🌐" },
        { name: "Sertifika — Almanya", lang: "TÜV / DAkkS kapsamı", type: "img", size: "640 KB", flag: "🇩🇪" },
        { name: "Sertifika — Arapça", lang: "Orta Doğu pazarı", type: "img", size: "580 KB", flag: "🇸🇦" },
        { name: "Sertifika — Türkçe", lang: "TSE belgesi", type: "img", size: "620 KB", flag: "🇹🇷" },
        { name: "Sertifika — İngilizce", lang: "Uluslararası baskı", type: "img", size: "590 KB", flag: "🇬🇧" },
        { name: "Sertifika — Rusça", lang: "BDT dağıtımı", type: "img", size: "560 KB", flag: "🇷🇺" },
      ],
    } satisfies QualityDocsData,
  },
];
