/**
 * Moniva eski site ürün import'u — eşleme tabloları (sadece veri, DB dokunmaz).
 * Kaynak: Desktop/Moniva2/moniva_products.xlsx (sheet "Products", 1407 satır).
 *
 * Kararlar:
 *  - YENİ TAKSONOMİ KATEGORİSİ YOK. Ürünler mevcut kategorilere girer.
 *  - Mevcut karşılığı olmayan aileler tek bir "Kategorisiz (Düzenlenecek)" kovasına
 *    (UNCAT) girer; kullanıcı sonra taşır. (categoryId zorunlu olduğu için kova şart.)
 *  - İsim/SKU ailesi kategoriden BAĞIMSIZ (kova'dan taşınınca isim/SKU bozulmaz).
 *  - SKU = MNV-{skuCode}-{sıra}; orijinal kod OEM referansı + "Stok Kodu" özelliği.
 *  - Görsel YOK. İçerik TÜRKÇE.
 */

export const XLSX_PATH = "/Users/himmetbuyukvadi/Desktop/Moniva2/moniva_products.xlsx";
export const SHEET_NAME = "Products";
export const BRAND_ID = "cmpwv2fkj0001rfebgtwyc9aq"; // Moniva

// Tek yardımcı kova kategori (taksonomi değil). Menüde görünmez.
export const UNCAT_CODE = "UNCAT";
export type NewCat = {
  code: string;
  name: string;
  parentCode: string | null;
  order: number;
  showInMenu: boolean;
};
export const NEW_CATEGORIES: NewCat[] = [
  { code: UNCAT_CODE, name: "Kategorisiz (Düzenlenecek)", parentCode: null, order: 999, showInMenu: false },
];

// (Ana :: Alt) -> { categoryCode: MEVCUT kategori kodu veya UNCAT, skuCode, nameStem }
// categoryCode daima mevcut bir kategori kodu ya da UNCAT olmalı (yeni taksonomi yok).
export type FamilyMap = { categoryCode: string; skuCode: string; nameStem: string };
export const FAMILY_MAP: Record<string, FamilyMap> = {
  // --- Hava Tüpleri (mevcut kök HT) ---
  "AIR TUBES::": { categoryCode: "HT", skuCode: "HTUP", nameStem: "Hava Tüpü" },
  // --- Fren pabuç bileşenleri (mevcut karşılık yok → kova) ---
  "BRAKE SHOE LININGS::": { categoryCode: UNCAT_CODE, skuCode: "FPBL", nameStem: "Fren Pabuç Balatası" },
  "BRAKE SHOE LOCKS::": { categoryCode: UNCAT_CODE, skuCode: "FPKL", nameStem: "Fren Pabuç Kilidi" },
  "BRAKE SHOE REPAIR KIT::": { categoryCode: UNCAT_CODE, skuCode: "FPTK", nameStem: "Fren Pabuç Tamir Takımı" },
  "BRAKE SHOE ROLLER::ROLLER LOCK PINS": { categoryCode: UNCAT_CODE, skuCode: "FPMP", nameStem: "Fren Pabuç Makara Kilit Pimi" },
  "BRAKE SHOE ROLLER::ROLLERS": { categoryCode: UNCAT_CODE, skuCode: "FPMR", nameStem: "Fren Pabuç Makarası" },
  "BRAKE SHOE ROLLER::WITH LOCK": { categoryCode: UNCAT_CODE, skuCode: "FPMK", nameStem: "Fren Pabuç Kilitli Makarası" },
  // --- Fren Papuçları (mevcut FP › Dorse) ---
  "BRAKE SHOES::TRAILER": { categoryCode: "DORS2", skuCode: "DORS2", nameStem: "Fren Papucu (Dorse)" },
  // --- Fren Tablaları (mevcut kök FT + yaprakları) ---
  "BRAKE SPIDER::": { categoryCode: "FT", skuCode: "FTGN", nameStem: "Fren Tablası" },
  "BRAKE SPIDER CHAMBER CARRIERS::PLASTIC TIN PLATE S SEAMS": { categoryCode: "FT", skuCode: "FTKT", nameStem: "Fren Tablası Körük Taşıyıcı" },
  "BRAKE SPIDER PINS::": { categoryCode: "FT", skuCode: "FTPN", nameStem: "Fren Tablası Pimi" },
  "BRAKE SPIDER PIPE - DIFFERENTIAL::": { categoryCode: "DEFR", skuCode: "DEFR", nameStem: "Fren Tablası (Defransiyel)" },
  "BRAKE SPIDER S SEAM PIPE - AXLE::": { categoryCode: "DING", skuCode: "DING", nameStem: "Fren Tablası (Dingil)" },
  // --- Mevcut karşılığı olmayanlar → kova ---
  "BRAKE SPRING::": { categoryCode: UNCAT_CODE, skuCode: "FY", nameStem: "Fren Yayı" },
  "BUSHES::": { categoryCode: UNCAT_CODE, skuCode: "BURC", nameStem: "Burç" },
  "CONNECTION ELEMENTS::": { categoryCode: UNCAT_CODE, skuCode: "BAGL", nameStem: "Bağlantı Elemanı" },
  "DRY AIR BRAKE PANEL::AXLE": { categoryCode: UNCAT_CODE, skuCode: "KHPD", nameStem: "Kuru Hava Fren Paneli (Dingil)" },
  "PANEL LEGGINGS SHEETS::": { categoryCode: UNCAT_CODE, skuCode: "KHPE", nameStem: "Panel Etek Sacı" },
  "S- CAMSHAFT::": { categoryCode: UNCAT_CODE, skuCode: "SCAM", nameStem: "S-Kam Mili" },
  // --- Servis Fren Körüğü (mevcut SFK + yaprakları) ---
  "SERVICE BRAKE CHAMBER::DISC": { categoryCode: "DISK2", skuCode: "DISK2", nameStem: "Servis Fren Körüğü Disk" },
  "SERVICE BRAKE CHAMBER::MAN - TRAILER": { categoryCode: "DORS", skuCode: "DORS", nameStem: "Servis Fren Körüğü Dorse" },
  "SERVICE BRAKE CHAMBER::NEW - LONG": { categoryCode: "UZUN2", skuCode: "UZUN2", nameStem: "Servis Fren Körüğü Uzun" },
  "SERVICE BRAKE CHAMBER::NEW - LONG - SHORT": { categoryCode: "UZUN2", skuCode: "UZUN2", nameStem: "Servis Fren Körüğü Uzun" },
  "SERVICE BRAKE CHAMBER::NEW - SHORT": { categoryCode: "KISA2", skuCode: "KISA2", nameStem: "Servis Fren Körüğü Kısa" },
  "SERVICE BRAKE CHAMBER::PARKING BRAKE CHAMBER": { categoryCode: "SFK", skuCode: "SFPB", nameStem: "Servis Park Fren Körüğü" },
  "SERVICE BRAKE CHAMBER::PIPE TYPE": { categoryCode: "BORU2", skuCode: "BORU2", nameStem: "Servis Fren Körüğü Borulu" },
  "SERVICE BRAKE CHAMBER::PIPE TYPE - FLANGE CONNECTING": { categoryCode: "FLAN2", skuCode: "FLAN2", nameStem: "Servis Fren Körüğü Flanşlı" },
  "SERVICE BRAKE CHAMBER::SHORT": { categoryCode: "KISA2", skuCode: "KISA2", nameStem: "Servis Fren Körüğü Kısa" },
  "SERVICE BRAKE CHAMBER::SLEEVE CONNECTOIN": { categoryCode: "FLAN2", skuCode: "FLAN2", nameStem: "Servis Fren Körüğü Flanşlı" },
  // --- İmdatlı Fren Körüğü D/D (mevcut IFKDD + yaprakları) ---
  "SPRING BRAKE CHAMBER D/D::DISC": { categoryCode: "DDD", skuCode: "DDD", nameStem: "İmdatlı Fren Körüğü D/D Disk" },
  "SPRING BRAKE CHAMBER D/D::LONG": { categoryCode: "UDD", skuCode: "UDD", nameStem: "İmdatlı Fren Körüğü D/D Uzun" },
  "SPRING BRAKE CHAMBER D/D::PARKING BRAKE CHAMBER - SPECIAL": { categoryCode: "IFKDD", skuCode: "IFPB", nameStem: "İmdatlı Fren Körüğü D/D Park (Özel)" },
  "SPRING BRAKE CHAMBER D/D::SHORT": { categoryCode: "KDD", skuCode: "KDD", nameStem: "İmdatlı Fren Körüğü D/D Kısa" },
  // --- İmdatlı Fren Körüğü D/P (mevcut IFKDP yaprakları) ---
  "SPRING BRAKE CHAMBER D/P::DISC": { categoryCode: "DISK", skuCode: "DISK", nameStem: "İmdatlı Fren Körüğü D/P Disk" },
  "SPRING BRAKE CHAMBER D/P::FLANGE CONNECTING": { categoryCode: "FLAN", skuCode: "FLAN", nameStem: "İmdatlı Fren Körüğü D/P Flanşlı" },
  "SPRING BRAKE CHAMBER D/P::LONG": { categoryCode: "UZUN", skuCode: "UZUN", nameStem: "İmdatlı Fren Körüğü D/P Uzun" },
  "SPRING BRAKE CHAMBER D/P::PIPE TYPE": { categoryCode: "BORU", skuCode: "BORU", nameStem: "İmdatlı Fren Körüğü D/P Borulu" },
  "SPRING BRAKE CHAMBER D/P::SHORT": { categoryCode: "KISA", skuCode: "KISA", nameStem: "İmdatlı Fren Körüğü D/P Kısa" },
};

// Teknik özellik kolonları -> Türkçe etiket + birim (görüntülenme sırası).
export type SpecCol = { col: string; label: string; unit: string | null };
export const SPEC_COLUMNS: SpecCol[] = [
  { col: "TYPE", label: "Tip", unit: null },
  { col: "STROKE", label: "Strok", unit: "mm" },
  { col: "DRUM", label: "Kampana", unit: "mm" },
  { col: "HIVE", label: "Petek", unit: "mm" },
  { col: "DRUM DIAMETER", label: "Kampana Çapı", unit: "mm" },
  { col: "LINING NUMBER", label: "Balata No", unit: null },
  { col: "DIMENSIONS", label: "Ölçü", unit: "mm" },
  { col: "DIRECTION", label: "Yön", unit: null },
  { col: "OUTER DIAMETER", label: "Dış Çap", unit: "mm" },
  { col: "FULL SIZE", label: "Tam Ölçü", unit: "mm" },
  { col: "SIZE", label: "Ölçü", unit: "mm" },
  { col: "WIDTH", label: "Genişlik", unit: "mm" },
  { col: "DIAMETER", label: "Çap", unit: "mm" },
  { col: "PIN SIZE", label: "Pim Ölçüsü", unit: "mm" },
  { col: "PIN DIAMETER", label: "Pim Çapı", unit: "mm" },
  { col: "INNER DIAMETER", label: "İç Çap", unit: "mm" },
  { col: "LINING WIDTH", label: "Balata Genişliği", unit: "mm" },
  { col: "ROLLER", label: "Makara Adedi", unit: "adet" },
  { col: "PIN", label: "Pim Adedi", unit: "adet" },
  { col: "LITER", label: "Hacim", unit: "L" },
  { col: "TUBE TYPE", label: "Tüp Tipi", unit: "mm" },
];

export const DIRECTION_MAP: Record<string, string> = {
  LEFT: "Sol",
  RIGHT: "Sağ",
  SOL: "Sol",
  "SAĞ": "Sağ",
  SAG: "Sağ",
  "DÜZ": "Düz",
  DUZ: "Düz",
};

export const EMPTY_VALUES = new Set(["", "-", "--", "none", "null", "n/a"]);
