// Türkçe-duyarlı slug + benzersizleştirici (import script'leri için).

const TR: Record<string, string> = {
  "ç": "c", "Ç": "c", "ğ": "g", "Ğ": "g", "ı": "i", "İ": "i",
  "ö": "o", "Ö": "o", "ş": "s", "Ş": "s", "ü": "u", "Ü": "u",
};

export function slugify(s: string): string {
  return (
    s
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR[c] ?? c)
      .toLowerCase()
      .replace(/&/g, " ve ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "urun"
  );
}

// Verilen "used" set'ine göre benzersiz slug üretir ve set'e ekler.
export function makeUnique(used: Set<string>) {
  return (base: string): string => {
    const b = base || "urun";
    let slug = b;
    let i = 2;
    while (used.has(slug)) slug = `${b}-${i++}`;
    used.add(slug);
    return slug;
  };
}
