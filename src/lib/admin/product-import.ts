// Client + server ortak: toplu ürün import şablonu, parse ve doğrulama.
// (server-only YOK — hem ProductImport client UI'sı hem importProducts action kullanır)

export const TEMPLATE_HEADERS = [
  "sku",
  "slug",
  "category",
  "brand",
  "partType",
  "material",
  "isActive",
  "isFeatured",
  "name_tr",
  "short_tr",
  "desc_tr",
  "name_en",
  "short_en",
  "desc_en",
  "oem",
  "specs",
] as const;

export type RawRow = Record<string, string>;

export const TEMPLATE_EXAMPLE: RawRow = {
  sku: "MNV-AS-3302",
  slug: "mnv-as-3302",
  category: "Hava Süspansiyon",
  brand: "",
  partType: "AFTERMARKET",
  material: "Pirinç",
  isActive: "true",
  isFeatured: "false",
  name_tr: "Seviyeleme Valfi — Hava Süspansiyon",
  short_tr: "Ağır hizmet seviyeleme valfi.",
  desc_tr: "Ticari treyler ve kamyon hava süspansiyon sistemleri için seviyeleme valfi.",
  name_en: "Levelling Valve — Air Suspension",
  short_en: "Heavy-duty levelling valve.",
  desc_en: "Levelling valve for commercial trailer and truck air suspension systems.",
  oem: "WABCO=4647030020; Knorr=K003705N00",
  specs: "Çalışma Basıncı=12.5 bar; Bağlantı=M22 x 1.5",
};

export type ImportLocaleContent = {
  name: string;
  shortDesc: string;
  description: string;
};

export type NormalizedRow = {
  sku: string;
  slug: string;
  categoryId: string;
  brandId: string | null;
  partType: "OEM" | "AFTERMARKET";
  material: string;
  isActive: boolean;
  isFeatured: boolean;
  translations: { TR?: ImportLocaleContent; EN?: ImportLocaleContent };
  oem: { manufacturer: string; oemNumber: string }[];
  specs: { key: string; value: string }[];
};

export type RowValidation =
  | { ok: true; data: NormalizedRow }
  | { ok: false; errors: string[] };

export type ImportLookupMaps = {
  categoryByKey: Record<string, string>;
  brandByName: Record<string, string>;
};

const SKU_RE = /^MNV-(?:[A-Z0-9]{2}-)?\d{3,6}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function asBool(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "evet" || s === "yes" || s === "x";
}

function parsePairs(v: string | undefined): { left: string; right: string }[] {
  if (!v) return [];
  return v
    .split(/[;\n]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const idx = p.indexOf("=");
      if (idx === -1) return { left: "", right: p };
      return { left: p.slice(0, idx).trim(), right: p.slice(idx + 1).trim() };
    });
}

export function validateRow(
  raw: RawRow,
  lookups: ImportLookupMaps,
): RowValidation {
  const errors: string[] = [];
  const g = (k: string) => (raw[k] ?? "").toString().trim();

  const sku = g("sku").toUpperCase();
  if (!sku) errors.push("SKU boş");
  else if (!SKU_RE.test(sku)) errors.push(`Geçersiz SKU: ${sku} (MNV-XX-NNNN veya MNV-NNNN)`);

  let slug = g("slug").toLowerCase();
  if (!slug) slug = slugify(sku);
  if (slug && !SLUG_RE.test(slug)) errors.push(`Geçersiz slug: ${slug}`);

  const catKey = g("category").toLowerCase();
  const categoryId = lookups.categoryByKey[catKey];
  if (!g("category")) errors.push("Kategori boş");
  else if (!categoryId) errors.push(`Kategori bulunamadı: ${g("category")}`);

  let brandId: string | null = null;
  if (g("brand")) {
    brandId = lookups.brandByName[g("brand").toLowerCase()] ?? null;
    if (!brandId) errors.push(`Marka bulunamadı: ${g("brand")}`);
  }

  const ptRaw = g("partType").toUpperCase();
  const partType: "OEM" | "AFTERMARKET" = ptRaw === "OEM" ? "OEM" : "AFTERMARKET";

  const nameTr = g("name_tr");
  const nameEn = g("name_en");
  if (!nameTr && !nameEn) errors.push("name_tr veya name_en gerekli");

  if (errors.length > 0) return { ok: false, errors };

  const translations: NormalizedRow["translations"] = {};
  if (nameTr)
    translations.TR = { name: nameTr, shortDesc: g("short_tr"), description: g("desc_tr") };
  if (nameEn)
    translations.EN = { name: nameEn, shortDesc: g("short_en"), description: g("desc_en") };

  const oem = parsePairs(g("oem"))
    .filter((p) => p.right)
    .map((p) => ({ manufacturer: p.left, oemNumber: p.right }));
  const specs = parsePairs(g("specs"))
    .filter((p) => p.left && p.right)
    .map((p) => ({ key: p.left, value: p.right }));

  return {
    ok: true,
    data: {
      sku,
      slug,
      categoryId,
      brandId,
      partType,
      material: g("material"),
      isActive: asBool(raw["isActive"]),
      isFeatured: asBool(raw["isFeatured"]),
      translations,
      oem,
      specs,
    },
  };
}
