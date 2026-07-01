// Kategori "kod"u üretimi — saf modül (client öneri + server garanti ortak kullanır).
// Kod = ürün SKU'sunun orta parçası konvansiyonu (MNV-AS-0001 → "AS").

// Türkçe karakterleri ASCII'ye indirger (kod A-Z0-9 olmalı).
const TR_ASCII: Record<string, string> = {
  İ: "I", I: "I", ı: "I", Ş: "S", ş: "S", Ğ: "G", ğ: "G",
  Ü: "U", ü: "U", Ö: "O", ö: "O", Ç: "C", ç: "C",
};

/**
 * Kategori adından 2-8 harf/rakam kod önerir: kelime baş harfleri
 * (tek kelimede ilk 4 harf). Türkçe harfler ASCII'ye çevrilir.
 * İsim boşsa "" döner.
 */
export function suggestCategoryCode(name: string): string {
  const ascii = name
    .replace(/[İIıŞşĞğÜüÖöÇç]/g, (ch) => TR_ASCII[ch] ?? ch)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, " ")
    .trim();
  if (!ascii) return "";
  const words = ascii.split(/\s+/).filter(Boolean);
  let code = words.map((w) => w[0]).join("");
  if (code.length < 2) code = words[0].slice(0, 4);
  return code.slice(0, 8);
}
