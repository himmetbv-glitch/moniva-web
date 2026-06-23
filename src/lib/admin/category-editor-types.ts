import type { Locale, SpecType } from "@prisma/client";

export type CategoryTr = { name: string; metaTitle: string; metaDesc: string };

export type EditorSpecAttr = {
  id: string; // mevcutsa CategorySpecAttribute.id, yeni satırda geçici "new-N"
  name: string;
  type: SpecType;
  unit: string;
  required: boolean;
};

export type EditorCategory = {
  id: string;
  code: string;
  slug: string;
  parentId: string;
  order: number;
  isActive: boolean;
  showInMenu: boolean;
  isFeatured: boolean;
  translations: Record<Locale, CategoryTr>;
  specAttributes: EditorSpecAttr[];
};

export type CategoryParentOption = { id: string; label: string };

// "Başka kategoriden kopyala" için
export type CategorySchemaSource = { id: string; label: string; attrCount: number };

export const SPEC_TYPES: SpecType[] = ["TEXT", "SELECT", "NUMBER", "DIMENSION", "RANGE"];

export const SPEC_TYPE_LABELS: Record<SpecType, string> = {
  TEXT: "Metin",
  SELECT: "Seçim",
  NUMBER: "Sayı",
  DIMENSION: "Boyut",
  RANGE: "Aralık",
};

// Mockup renk eşlemesi (admin pill türleri)
export const SPEC_TYPE_PILL: Record<SpecType, "info" | "ok" | "warn" | "err" | "mute"> = {
  TEXT: "info",
  SELECT: "warn",
  NUMBER: "ok",
  DIMENSION: "err",
  RANGE: "mute",
};

export function blankEditorCategory(): EditorCategory {
  const blank: CategoryTr = { name: "", metaTitle: "", metaDesc: "" };
  return {
    id: "",
    code: "",
    slug: "",
    parentId: "",
    order: 0,
    isActive: true,
    showInMenu: true,
    isFeatured: false,
    translations: { TR: { ...blank }, EN: { ...blank }, RU: { ...blank }, AR: { ...blank } },
    specAttributes: [],
  };
}
