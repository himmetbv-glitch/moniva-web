import "server-only";

import { Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type {
  EditorOptions,
  EditorProduct,
  EditorTranslation,
} from "./product-editor-types";

export type {
  EditorOptions,
  EditorProduct,
  EditorTranslation,
  CategoryOption,
  BrandOption,
} from "./product-editor-types";

function emptyTranslations(): Record<Locale, EditorTranslation> {
  const blank: EditorTranslation = {
    name: "", shortDesc: "", description: "", metaTitle: "", metaDesc: "",
  };
  return {
    TR: { ...blank }, EN: { ...blank }, RU: { ...blank }, AR: { ...blank },
  };
}

export async function getEditorOptions(
  locale: Locale = DEFAULT_LOCALE,
): Promise<EditorOptions> {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        parentId: true,
        translations: { select: { locale: true, name: true } },
        specAttributes: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, unit: true, required: true },
        },
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const nameOf = (c: (typeof categories)[number]) =>
    c.translations.find((t) => t.locale === locale)?.name ??
    c.translations[0]?.name ??
    c.slug;
  const byId = new Map(categories.map((c) => [c.id, c]));

  const schemas: EditorOptions["schemas"] = {};
  for (const c of categories) {
    schemas[c.id] = c.specAttributes.map((a) => ({
      attributeId: a.id,
      name: a.name,
      unit: a.unit ?? "",
      required: a.required,
    }));
  }

  return {
    categories: categories.map((c) => {
      const parent = c.parentId ? byId.get(c.parentId) : null;
      const label = parent ? `${nameOf(parent)} › ${nameOf(c)}` : nameOf(c);
      return { id: c.id, label };
    }),
    brands: brands.map((b) => ({ id: b.id, name: b.name })),
    schemas,
  };
}

export function blankEditorProduct(): EditorProduct {
  return {
    id: "",
    sku: "",
    slug: "",
    material: "",
    partType: "AFTERMARKET",
    categoryId: "",
    brandId: "",
    isActive: false,
    isFeatured: false,
    translations: emptyTranslations(),
    specs: [],
    oem: [],
  };
}

export async function getProductForEdit(id: string): Promise<EditorProduct | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      sku: true,
      slug: true,
      material: true,
      partType: true,
      categoryId: true,
      brandId: true,
      isActive: true,
      isFeatured: true,
      translations: true,
      specs: { orderBy: { order: "asc" }, select: { attributeId: true, key: true, value: true, unit: true } },
      oemReferences: {
        orderBy: { createdAt: "asc" },
        select: { manufacturer: true, oemNumber: true },
      },
    },
  });
  if (!p) return null;

  const translations = emptyTranslations();
  for (const t of p.translations) {
    translations[t.locale] = {
      name: t.name ?? "",
      shortDesc: t.shortDesc ?? "",
      description: t.description ?? "",
      metaTitle: t.metaTitle ?? "",
      metaDesc: t.metaDesc ?? "",
    };
  }

  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    material: p.material ?? "",
    partType: p.partType,
    categoryId: p.categoryId,
    brandId: p.brandId ?? "",
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    translations,
    specs: p.specs.map((s) => ({
      attributeId: s.attributeId ?? null,
      key: s.key,
      value: s.value,
      unit: s.unit ?? "",
    })),
    oem: p.oemReferences.map((o) => ({
      manufacturer: o.manufacturer ?? "",
      oemNumber: o.oemNumber,
    })),
  };
}
