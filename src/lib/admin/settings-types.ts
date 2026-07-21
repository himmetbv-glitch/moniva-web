export type SiteSettings = {
  companyName: string;
  addressLine: string;
  phone: string;
  email: string;
  whatsapp: string;
  linkedinUrl: string;
  xUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  metaTitleBase: string;
  metaDescBase: string;
  notifyEmail: string;
  careerPositions: string[];
};

export const DEFAULT_CAREER_POSITIONS = [
  "Satış & İhracat",
  "Operasyon & Depo",
  "Mühendislik & Ar-Ge",
  "BT & Dijital",
  "Finans & İdari",
  "Açık başvuru",
];

// DB'de satır yoksa kullanılan varsayılanlar (şema @default ile aynı).
export const DEFAULT_SETTINGS: SiteSettings = {
  companyName: "MONIVA Otomotiv ve Gıda San. Tic. A.Ş.",
  addressLine: "Selçuklu / Konya, Türkiye",
  phone: "+90 332 239 03 05",
  email: "export@moniva.com.tr",
  whatsapp: "",
  linkedinUrl: "",
  xUrl: "",
  youtubeUrl: "",
  instagramUrl: "",
  metaTitleBase: "Moniva",
  metaDescBase: "",
  notifyEmail: "",
  careerPositions: DEFAULT_CAREER_POSITIONS,
};
