import type { SeedSection } from "./home-sections";

export type Stat = { v: string; l: string };

export type CareersInfoData = {
  crumbLabel: string;
  image: string;
  titleAccent: string;
  titleRest: string;
  lead: string;
  stats: Stat[];
  emailLabel: string;
  emailPre: string;
  emailAddr: string;
  emailPost: string;
};

export const CAREERS_PAGE = {
  key: "careers",
  title: "Kariyer",
  path: "/kariyer",
  seoTitle: "Kariyer — Moniva",
  seoDesc:
    "50.000+ kamyon parçasının arkasındaki ekibe katılın. Moniva'ya başvurun — her başvuruyu değerlendirir, iki hafta içinde dönüş yaparız.",
} as const;

export const CAREERS_SECTIONS: SeedSection[] = [
  {
    key: "info",
    type: "CAREERS_INFO",
    name: "Bilgi Paneli",
    kind: "Başlık + İstatistik + E-posta",
    sub: "Başvuru formu yanındaki tanıtım paneli",
    order: 1,
    visible: true,
    data: {
      crumbLabel: "Kariyer",
      image: "/home/factory.jpg",
      titleAccent: "50.000+",
      titleRest: " kamyon parçasının arkasındaki ekibe katılın.",
      lead: "Ticari araç komponentlerini 50+ ülkedeki filo işletmecilerine tedarik ediyoruz. Bilgilerinizi gönderin — her başvuruyu inceliyor ve iki hafta içinde dönüş yapıyoruz.",
      stats: [
        { v: "70+", l: "Ekip Üyesi" },
        { v: "65 Yıl", l: "Sektörde Tecrübe" },
        { v: "50+", l: "Ülkeye Hizmet" },
      ],
      emailLabel: "E-posta tercih eder misiniz?",
      emailPre: "CV'nizi doğrudan",
      emailAddr: "careers@moniva.com.tr",
      emailPost: "adresine gönderin",
    } satisfies CareersInfoData,
  },
];
