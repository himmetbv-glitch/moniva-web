/**
 * Detay özellik import'u — İngilizce kolon → Türkçe etiket + değer çevirisi.
 * Kaynak: web/veriler/moniva_urunler_tam_gir.xlsx (kategori bazlı sayfalar).
 * Not: BİRİM UYDURULMAZ — değerler kaynaktaki gibi ham girilir (eski site de birimsiz).
 */

export const DETAIL_XLSX_PATH =
  "/Users/himmetbuyukvadi/Desktop/isler/moniva/web/veriler/moniva_urunler_tam_gir.xlsx";

// "-", boş vb. → atlanır
export const DETAIL_EMPTY = new Set(["", "-", "--", "n/a", "none", "null", "yok"]);

// Özellik olarak GİRİLMEYECEK kolonlar (ayrı ele alınır veya iş kuralı gereği hariç)
export const SKIP_COLUMNS = new Set([
  "STOCK CODE", // "Stok Kodu" olarak ayrı eklenir
  "KATEGORI", // kategori bilgisi (ürün özelliği değil)
  "ACIKLAMA", // açıklamaya gider
  "AUGUST PRICES", // FİYAT — herkese açık fiyat YOK kuralı → asla girme
]);

// İngilizce kolon adı → Türkçe özellik etiketi (görünen sırayı da belirler)
export const COLUMN_TR: Record<string, string> = {
  "USE PLACE": "Kullanım Yeri",
  "OE NUMBER": "OE Numarası",
  OEM: "OE Numarası",
  TYPE: "Tip",
  STROKE: "Strok",
  "FLANGE LENGTH": "Flanş Uzunluğu",
  "TYPE OF PULLER": "Çektirme Tipi",
  "SHAFT LENGTH": "Mil Uzunluğu",
  CENTER: "Merkez",
  SCREW: "Vida",
  "SCREW LENGTH": "Vida Uzunluğu",
  "SCREW HOLE NUMBER": "Vida Deliği Sayısı",
  "TOP BOWL": "Üst Kap",
  "AIR INTAKE": "Hava Girişi",
  KG: "Ağırlık (kg)",
  WEIGHT: "Ağırlık (kg)",
  "WEIGHT KG": "Ağırlık (kg)",
  "OPERATING PRESSURE": "Çalışma Basıncı",
  "NUMBER OF HOLES": "Delik Sayısı",
  "DRUM DIAMETER": "Kampana Çapı",
  DRUM: "Kampana",
  "LINING NUMBER": "Balata No",
  "LINING WIDTH": "Balata Genişliği",
  "FULL SIZE": "Tam Ölçü",
  "RIVET DIAMETER": "Perçin Çapı",
  "SHEET THICKNESS": "Sac Kalınlığı",
  "TREAD SHEET THICKNESS": "Basamak Sacı Kalınlığı",
  "DIAMETER OF PIN": "Pim Çapı",
  "SPRING PIN DIAMETER": "Yay Pimi Çapı",
  "DISTANCE BETWEEN SWORDS": "Kılıçlar Arası Mesafe",
  "TOP OF SWORD": "Kılıç Üstü",
  SIZE: "Ölçü",
  "SIZE MEASURE": "Ölçü",
  "EXTERNAL MEASURE": "Dış Ölçü",
  DIAMETER: "Çap",
  "OUTER DIAMETER": "Dış Çap",
  "INNER DIAMETER": "İç Çap",
  "OTHER DIAMETER": "Diğer Çap",
  "HEAD DIAMETER": "Kafa Çapı",
  "HEAD WIDTH": "Kafa Genişliği",
  "HOLE DIAMETER": "Delik Çapı",
  "PIPE HOLE DIAMETER": "Boru Deliği Çapı",
  DIRECTION: "Yön",
  "PIPE SIZE": "Boru Ölçüsü",
  "DIAMETER OF PIPE": "Boru Çapı",
  "HOLE CENTER": "Delik Merkezi",
  "FLANGE HOLE CENTER": "Flanş Delik Merkezi",
  "FLANGE WITDH": "Flanş Genişliği",
  DIMENSIONS: "Ebatlar",
  "GRAVEIL BUSH SIZE": "Burç Ölçüsü",
  "BUSH SIZE": "Burç Ölçüsü",
  "WITH BUSH - WITHOUT BUSH": "Burç Durumu",
  BUSH: "Burç",
  "O-RING SIZE": "O-Ring Ölçüsü",
  "CIRCLIP O-GING": "Sirklip / O-Ring",
  HIVE: "Petek",
  HOLE: "Delik",
  "WIRE THICKNESS": "Tel Kalınlığı",
  "NUMBER OF CANALS": "Kanal Sayısı",
  "ROLLER HEIGHT": "Makara Yüksekliği",
  ROLLER: "Makara",
  "DISTANCE BETWEEN TWO HOLES": "İki Delik Arası",
  "CENTER BETWEEN HOLES": "Delikler Arası Merkez",
  "CENTER BETWEEN TWO HOLES": "İki Delik Arası Merkez",
  "LENGTH BETWEEN HOLES": "Delikler Arası Uzunluk",
  "PIN, S SEAM DIAMETER": "Pim / S Dikiş Çapı",
  "PIN SIZE": "Pim Ölçüsü",
  "PIN DIAMETER": "Pim Çapı",
  PIN: "Pim",
  WIDTH: "Genişlik",
  THICKNESS: "Kalınlık",
  "DISTANCE BETWEEN TWO CIRCLIPS": "İki Sirklip Arası",
  CIRCLIPS: "Sirklip",
  "LOCK SIZE": "Kilit Ölçüsü",
  "LOCK WIDTH": "Kilit Genişliği",
  "LOCK DIAMETER": "Kilit Çapı",
  "LOCK THICKNESS": "Kilit Kalınlığı",
  "GLASSES LOCK": "Gözlük Kilit",
  SPRING: "Yay",
  LITER: "Hacim (L)",
  "DISTANCE BETWEEN WELD SEAMS": "Kaynak Dikişleri Arası",
  CIRCLE: "Çember",
  "NUMBER OF COVER FITTINGS": "Kapak Rakor Sayısı",
  "NUMBER OF BODY FITTINGS": "Gövde Rakor Sayısı",
};

// Sabit/sayılabilir metin değerleri → Türkçe (yalnız tam eşleşme, büyük harf normalize)
export const VALUE_TR: Record<string, string> = {
  "VARIOUS VEHICLES": "Çeşitli Araçlar",
  LONG: "Uzun",
  SHORT: "Kısa",
  LEFT: "Sol",
  RIGHT: "Sağ",
  "WITH BUSH": "Burçlu",
  "WITHOUT BUSH": "Burçsuz",
  "WITH LOCK": "Kilitli",
  "WITHOUT LOCK": "Kilitsiz",
  YES: "Evet",
  NO: "Hayır",
  DISC: "Disk",
  DRUM: "Kampana",
};

/** Bir hücre değerini Türkçeye çevir (tam metin eşleşmesi varsa), yoksa ham bırak. */
export function trValue(raw: string): string {
  const key = raw.trim().toUpperCase();
  return VALUE_TR[key] ?? raw.trim();
}
