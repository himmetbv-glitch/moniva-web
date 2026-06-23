import type { Locale } from "@prisma/client";

export const EDITOR_LOCALES: { code: Locale; label: string; rtl?: boolean }[] = [
  { code: "TR", label: "Türkçe" },
  { code: "EN", label: "English" },
  { code: "RU", label: "Русский" },
  { code: "AR", label: "العربية", rtl: true },
];

export type CategoryOption = { id: string; label: string };
export type BrandOption = { id: string; name: string };

// Kategori spec şema attribute'u (ürün editörü değer girişi için)
export type CategorySchemaAttr = {
  attributeId: string;
  name: string;
  unit: string;
  required: boolean;
};

export type EditorOptions = {
  categories: CategoryOption[];
  brands: BrandOption[];
  // categoryId → o kategorinin teknik özellik şeması (sıralı)
  schemas: Record<string, CategorySchemaAttr[]>;
};

export type EditorTranslation = {
  name: string;
  shortDesc: string;
  description: string;
  metaTitle: string;
  metaDesc: string;
};

export type EditorProduct = {
  id: string;
  sku: string;
  slug: string;
  material: string;
  partType: "OEM" | "AFTERMARKET";
  categoryId: string;
  brandId: string;
  isActive: boolean;
  isFeatured: boolean;
  translations: Record<Locale, EditorTranslation>;
  // attributeId dolu = kategori şemasına bağlı; null = şema dışı (eski) serbest satır
  specs: { attributeId: string | null; key: string; value: string; unit: string }[];
  oem: { manufacturer: string; oemNumber: string }[];
};
