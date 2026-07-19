import { Locale, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { normalizeOem } from "@/lib/products/normalize-oem";
import type { ProductFilters } from "@/lib/validation/product-filters";

export const PER_PAGE = 24;

export type ProductCardView = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string | null;
  brand: string | null;
  partType: "OEM" | "AFTERMARKET";
  oemNumbers: string[];
  imageUrl: string | null;
  isFeatured: boolean;
};

export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  count: number;
  children: CategoryNode[];
};

export type BrandFilter = {
  slug: string;
  name: string;
  count: number;
};

export type SpecRow = { key: string; value: string; unit: string | null };
export type CrossRef = { oemNumber: string; manufacturer: string | null };
export type DocFile = {
  locale: Locale;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
};

export type KitComponentRow = {
  sku: string;
  slug: string;
  name: string;
  qty: number;
  dimension: string | null;
  sortOrder: number;
};

export type UsedInKitRow = {
  sku: string;
  slug: string;
  name: string;
  qty: number;
};

export type ProductDetailView = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  shortDesc: string | null;
  material: string | null;
  categoryId: string;
  category: string | null;
  categorySlug: string | null;
  brand: string | null;
  partType: "OEM" | "AFTERMARKET";
  isFeatured: boolean;
  images: { url: string; alt: string | null }[];
  specs: SpecRow[];
  crossRefs: CrossRef[];
  documents: DocFile[];
  kitComponents: KitComponentRow[]; // Bu ürün kit ise: içindeki bileşenler
  usedInKits:    UsedInKitRow[];    // Bu ürün başka kitlerde bileşense: hangileri
};

export type ProductListResult = {
  items: ProductCardView[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

// ---------------------------------------------------------------------------
// Kategori ağacı (hiyerarşik — parent + children, isimler locale'den)
// ---------------------------------------------------------------------------

export async function getCategoryTree(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CategoryNode[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      translations: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { order: "asc" },
  });

  const byId = new Map(categories.map((c) => [c.id, c]));
  const roots = categories.filter((c) => !c.parentId || !byId.has(c.parentId));

  const toNode = (c: (typeof categories)[number]): CategoryNode => {
    const children = categories
      .filter((x) => x.parentId === c.id)
      .map(toNode);
    return {
      id: c.id,
      slug: c.slug,
      name: pickTranslation(c.translations, locale)?.name ?? c.slug,
      count:
        c._count.products +
        children.reduce((sum, ch) => sum + ch.count, 0),
      children,
    };
  };

  return roots.map(toNode);
}

// ---------------------------------------------------------------------------
// Markalar (aktif ürünü olan, ürün sayısıyla)
// ---------------------------------------------------------------------------

export async function getBrands(): Promise<BrandFilter[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return brands
    .map((b) => ({ slug: b.slug, name: b.name, count: b._count.products }))
    .filter((b) => b.count > 0);
}

// ---------------------------------------------------------------------------
// Ürün listesi (filtre + sıralama + sayfalama)
// ---------------------------------------------------------------------------

/** Seçilen kategori slug'ı + (varsa) alt kategorilerinin id'lerini döndürür. */
async function resolveCategoryIds(slug: string): Promise<string[]> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, children: { select: { id: true } } },
  });
  if (!category) return [];
  return [category.id, ...category.children.map((c) => c.id)];
}

export async function getProducts(
  filters: ProductFilters,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ProductListResult> {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.kategori) {
    const ids = await resolveCategoryIds(filters.kategori);
    where.categoryId = { in: ids.length > 0 ? ids : ["__none__"] };
  }
  if (filters.marka.length > 0) {
    where.brand = { slug: { in: filters.marka } };
  }
  if (filters.q) {
    const q = filters.q;
    // OEM araması ayraçtan bağımsız: hem saklanan numara hem sorgu normalleştirilir
    // ("0 308 875 023" / "0.308.875.023" / "0308875023" hepsi eşleşir).
    const qNorm = normalizeOem(q);
    const byOem = qNorm
      ? {
          oemReferences: {
            some: { oemNumberNormalized: { contains: qNorm } },
          },
        }
      : null;
    const byCategory = {
      category: {
        translations: {
          some: { name: { contains: q, mode: "insensitive" as const } },
        },
      },
    };
    if (filters.qmod === "oem") {
      where.OR = byOem ? [byOem] : [{ id: "__none__" }];
    } else if (filters.qmod === "kategori") {
      where.OR = [byCategory];
    } else {
      where.OR = [
        { sku: { contains: q, mode: "insensitive" } },
        {
          translations: {
            some: { name: { contains: q, mode: "insensitive" } },
          },
        },
        ...(byOem ? [byOem] : []),
      ];
    }
  }

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(filters.sayfa, totalPages);

  const include = {
    translations: true,
    images: { orderBy: [{ isMain: "desc" }, { order: "asc" }] },
    oemReferences: { orderBy: { oemNumber: "asc" } },
    category: { include: { translations: true } },
    brand: true,
  } satisfies Prisma.ProductInclude;

  type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

  const toView = (p: Row): ProductCardView => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: pickTranslation(p.translations, locale)?.name ?? p.sku,
    category: pickTranslation(p.category.translations, locale)?.name ?? null,
    brand: p.brand?.name ?? null,
    partType: p.partType,
    oemNumbers: p.oemReferences.map((o) => o.oemNumber),
    imageUrl: p.images[0]?.url ?? null,
    isFeatured: p.isFeatured,
  });

  // "Ad" sıralaması çeviri tablosuna bağlı → DB'de orderBy zor; JS'te yapılır.
  if (filters.sirala === "ad") {
    const all = await prisma.product.findMany({ where, include });
    const sorted = all
      .map(toView)
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
    const start = (page - 1) * PER_PAGE;
    return {
      items: sorted.slice(start, start + PER_PAGE),
      total,
      page,
      perPage: PER_PAGE,
      totalPages,
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    filters.sirala === "yeni"
      ? [{ createdAt: "desc" }]
      : filters.sirala === "ref"
        ? [{ sku: "asc" }]
        : [{ sortOrder: "asc" }, { isFeatured: "desc" }, { createdAt: "desc" }, { sku: "asc" }]; // one-cikan (admin manuel sırası önce)

  const rows = await prisma.product.findMany({
    where,
    include,
    orderBy,
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  return {
    items: rows.map(toView),
    total,
    page,
    perPage: PER_PAGE,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Ürün detay (slug ile) + benzer ürünler
// ---------------------------------------------------------------------------

export async function getProductDetail(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ProductDetailView | null> {
  const p = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      translations: true,
      specs: { orderBy: { order: "asc" } },
      oemReferences: { orderBy: { oemNumber: "asc" } },
      datasheets: true,
      images: { orderBy: [{ isMain: "desc" }, { order: "asc" }] },
      category: { include: { translations: true } },
      brand: true,
      kitComponents: {
        orderBy: { sortOrder: "asc" },
        include: {
          component: { include: { translations: true } },
        },
      },
      usedInKits: {
        orderBy: { parent: { sku: "asc" } },
        include: {
          parent: { include: { translations: true } },
        },
      },
    },
  });
  if (!p) return null;

  const tr = pickTranslation(p.translations, locale);
  const catTr = pickTranslation(p.category.translations, locale);

  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: tr?.name ?? p.sku,
    description: tr?.description ?? "",
    shortDesc: tr?.shortDesc ?? null,
    material: p.material,
    categoryId: p.categoryId,
    category: catTr?.name ?? null,
    categorySlug: p.category.slug,
    brand: p.brand?.name ?? null,
    partType: p.partType,
    isFeatured: p.isFeatured,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    specs: p.specs.map((s) => ({ key: s.key, value: s.value, unit: s.unit })),
    crossRefs: p.oemReferences.map((o) => ({
      oemNumber: o.oemNumber,
      manufacturer: o.manufacturer,
    })),
    documents: p.datasheets.map((d) => ({
      locale: d.locale,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      fileSize: d.fileSize,
    })),
    kitComponents: p.kitComponents.map((kc) => ({
      sku:       kc.component.sku,
      slug:      kc.component.slug,
      name:      pickTranslation(kc.component.translations, locale)?.name ?? kc.component.sku,
      qty:       kc.qty,
      dimension: kc.dimension,
      sortOrder: kc.sortOrder,
    })),
    usedInKits: p.usedInKits.map((kc) => ({
      sku:  kc.parent.sku,
      slug: kc.parent.slug,
      name: pickTranslation(kc.parent.translations, locale)?.name ?? kc.parent.sku,
      qty:  kc.qty,
    })),
  };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  locale: Locale = DEFAULT_LOCALE,
  take = 4,
): Promise<ProductCardView[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: excludeId } },
    take,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      translations: true,
      images: { orderBy: [{ isMain: "desc" }, { order: "asc" }] },
      oemReferences: { orderBy: { oemNumber: "asc" } },
      category: { include: { translations: true } },
      brand: true,
    },
  });

  return rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: pickTranslation(p.translations, locale)?.name ?? p.sku,
    category: pickTranslation(p.category.translations, locale)?.name ?? null,
    brand: p.brand?.name ?? null,
    partType: p.partType,
    oemNumbers: p.oemReferences.map((o) => o.oemNumber),
    imageUrl: p.images[0]?.url ?? null,
    isFeatured: p.isFeatured,
  }));
}

/** Detay sayfası için categoryId gerekiyor (benzer ürünler). */
export async function getProductCategoryId(
  slug: string,
): Promise<{ id: string; categoryId: string } | null> {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true, categoryId: true },
  });
}
