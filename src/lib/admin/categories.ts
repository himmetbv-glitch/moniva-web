import "server-only";

import { Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type {
  CategoryParentOption,
  CategorySchemaSource,
  CategoryTr,
  EditorCategory,
} from "./category-editor-types";

export type { CategoryParentOption, EditorCategory } from "./category-editor-types";
export { blankEditorCategory } from "./category-editor-types";

export type AdminCategoryRow = {
  id: string;
  code: string;
  slug: string;
  name: string;
  depth: number;
  order: number;
  productCount: number;
  childCount: number;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
};

function emptyCatTranslations(): Record<Locale, CategoryTr> {
  const blank: CategoryTr = { name: "", metaTitle: "", metaDesc: "" };
  return { TR: { ...blank }, EN: { ...blank }, RU: { ...blank }, AR: { ...blank } };
}

export async function getAdminCategories(
  locale: Locale = DEFAULT_LOCALE,
): Promise<AdminCategoryRow[]> {
  const cats = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      slug: true,
      parentId: true,
      order: true,
      isActive: true,
      translations: { select: { locale: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
  });

  const nameOf = (c: (typeof cats)[number]) =>
    c.translations.find((t) => t.locale === locale)?.name ??
    c.translations[0]?.name ??
    c.slug;

  const byParent = new Map<string | null, typeof cats>();
  for (const c of cats) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }

  const out: AdminCategoryRow[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const siblings = byParent.get(parentId) ?? [];
    siblings.forEach((c, i) => {
      out.push({
        id: c.id,
        code: c.code,
        slug: c.slug,
        name: nameOf(c),
        depth,
        order: c.order,
        productCount: c._count.products,
        childCount: c._count.children,
        isActive: c.isActive,
        isFirst: i === 0,
        isLast: i === siblings.length - 1,
      });
      walk(c.id, depth + 1);
    });
  };
  walk(null, 0);
  return out;
}

export async function getCategoryParentOptions(
  excludeId?: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<CategoryParentOption[]> {
  const rows = await getAdminCategories(locale);
  // Kendini ve alt ağacını parent seçeneklerinden çıkar (döngü olmasın)
  const excluded = new Set<string>();
  if (excludeId) {
    excluded.add(excludeId);
    // alt ağaç: depth bazlı basit tarama
    const idx = rows.findIndex((r) => r.id === excludeId);
    if (idx >= 0) {
      const baseDepth = rows[idx].depth;
      for (let i = idx + 1; i < rows.length && rows[i].depth > baseDepth; i++) {
        excluded.add(rows[i].id);
      }
    }
  }
  return rows
    .filter((r) => !excluded.has(r.id))
    .map((r) => ({ id: r.id, label: `${"— ".repeat(r.depth)}${r.name}` }));
}

export async function getCategoryForEdit(id: string): Promise<EditorCategory | null> {
  const c = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      slug: true,
      parentId: true,
      order: true,
      image: true,
      isActive: true,
      showInMenu: true,
      isFeatured: true,
      translations: true,
      specAttributes: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, type: true, unit: true, required: true },
      },
    },
  });
  if (!c) return null;

  const translations = emptyCatTranslations();
  for (const t of c.translations) {
    translations[t.locale] = {
      name: t.name ?? "",
      metaTitle: t.metaTitle ?? "",
      metaDesc: t.metaDesc ?? "",
    };
  }

  return {
    id: c.id,
    code: c.code,
    slug: c.slug,
    parentId: c.parentId ?? "",
    order: c.order,
    image: c.image ?? "",
    isActive: c.isActive,
    showInMenu: c.showInMenu,
    isFeatured: c.isFeatured,
    translations,
    specAttributes: c.specAttributes.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      unit: a.unit ?? "",
      required: a.required,
    })),
  };
}

// "Başka kategoriden kopyala" — attribute'u olan diğer kategoriler.
export async function getCategorySchemaSources(
  excludeId?: string,
): Promise<CategorySchemaSource[]> {
  const rows = await prisma.category.findMany({
    where: {
      specAttributes: { some: {} },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: [{ order: "asc" }, { code: "asc" }],
    select: {
      id: true,
      translations: {
        where: { locale: DEFAULT_LOCALE },
        select: { name: true },
        take: 1,
      },
      _count: { select: { specAttributes: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.translations[0]?.name ?? "(adsız)",
    attrCount: r._count.specAttributes,
  }));
}

// Kopyalama için bir kategorinin attribute şemasını döndürür.
export async function getCategoryAttributes(categoryId: string) {
  const rows = await prisma.categorySpecAttribute.findMany({
    where: { categoryId },
    orderBy: { order: "asc" },
    select: { name: true, type: true, unit: true, required: true },
  });
  return rows.map((a) => ({
    name: a.name,
    type: a.type,
    unit: a.unit ?? "",
    required: a.required,
  }));
}
