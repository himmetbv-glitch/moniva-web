import { Locale, Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { CACHE_SCOPE, CACHE_SECONDS, CATALOG_TAG } from "@/lib/cache-tags";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { normalizeOem } from "@/lib/products/normalize-oem";
import {
  normalizeSearch,
  type ProductFilters,
  type QMode,
  type SortValue,
} from "@/lib/validation/product-filters";

export const PER_PAGE = 24;

/**
 * Wraps a public catalogue read in the shared data cache (1 h, tag "catalog").
 * Arguments become part of the key, so callers pass normalised values — an
 * unbounded key is an unbounded cache, which is how a crawler looping over URL
 * variants used to cost a full set of queries each time. Cached values travel
 * as JSON: no Date fields in anything returned from here.
 */
function cached<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) {
  return unstable_cache(fn, [`catalog:${name}`, CACHE_SCOPE], {
    revalidate: CACHE_SECONDS,
    tags: [CATALOG_TAG],
  });
}

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
  code: string;
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
// Kategori tablosu — tek önbellekli kaynak
// ---------------------------------------------------------------------------

type CategoryRow = {
  id: string;
  parentId: string | null;
  code: string;
  slug: string;
  order: number;
  isActive: boolean;
  image: string | null;
  translations: { locale: Locale; name: string }[];
  activeProducts: number;
};

/**
 * Every category, active or not, with its active-product count. The sidebar
 * tree, the footer column, the home grid, the showcase, slug validation and
 * `resolveCategoryIds` all derive from this one read.
 */
const loadCategoryRows = cached("category-rows", async (): Promise<CategoryRow[]> => {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      parentId: true,
      code: true,
      slug: true,
      order: true,
      isActive: true,
      image: true,
      translations: { select: { locale: true, name: true } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { order: "asc" },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, activeProducts: _count.products }));
});

// Page and footer render in the same request; one cache lookup between them.
const getCategoryRows = cache(() => loadCategoryRows());

/** Slugs that may appear in `kategori`; anything else is dropped. */
export async function getCategorySlugs(): Promise<string[]> {
  return (await getCategoryRows()).map((c) => c.slug);
}

// ---------------------------------------------------------------------------
// Kategori ağacı (hiyerarşik — parent + children, isimler locale'den)
// ---------------------------------------------------------------------------

export async function getCategoryTree(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CategoryNode[]> {
  const categories = (await getCategoryRows()).filter((c) => c.isActive);

  const byId = new Map(categories.map((c) => [c.id, c]));
  const roots = categories.filter((c) => !c.parentId || !byId.has(c.parentId));

  const toNode = (c: CategoryRow): CategoryNode => {
    const children = categories
      .filter((x) => x.parentId === c.id)
      .map(toNode);
    return {
      id: c.id,
      code: c.code,
      slug: c.slug,
      name: pickTranslation(c.translations, locale)?.name ?? c.slug,
      count:
        c.activeProducts +
        children.reduce((sum, ch) => sum + ch.count, 0),
      children,
    };
  };

  return roots.map(toNode);
}

// ---------------------------------------------------------------------------
// Kategori vitrini (ürünler sayfası açılışı — kök kategori kartları)
// ---------------------------------------------------------------------------

export type ShowcaseCategory = {
  slug: string;
  name: string;
  count: number;
  image: string | null;
};

/**
 * Vitrin kartları: KÖK kategoriler (Kategorisiz/UNCAT hariç, ürünü olanlar),
 * ürün sayısına göre çoktan aza. Görsel önceliği: elle seçilen category.image;
 * yoksa o kategorideki (alt kategoriler dahil) bir ürünün ana görseline düşer.
 */
export function getShowcaseCategories(
  locale: Locale = DEFAULT_LOCALE,
): Promise<ShowcaseCategory[]> {
  return cachedShowcase(locale);
}

const cachedShowcase = cached("showcase", async (locale: Locale): Promise<ShowcaseCategory[]> => {
  const categories = (await getCategoryRows()).filter((c) => c.isActive);

  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenOf = new Map<string, typeof categories>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const arr = childrenOf.get(c.parentId);
    if (arr) arr.push(c);
    else childrenOf.set(c.parentId, [c]);
  }
  const countOf = (c: (typeof categories)[number]): number =>
    c.activeProducts +
    (childrenOf.get(c.id) ?? []).reduce((s, ch) => s + countOf(ch), 0);
  const descendantIds = (c: (typeof categories)[number]): string[] => {
    const out = [c.id];
    for (const ch of childrenOf.get(c.id) ?? []) out.push(...descendantIds(ch));
    return out;
  };

  // Kenar çubuğuyla (getCategoryTree, orderBy order asc) AYNI sıra; eşitlikte
  // ürün sayısı çoktan aza.
  const roots = categories
    .filter((c) => (!c.parentId || !byId.has(c.parentId)) && c.code !== "UNCAT")
    .map((c) => ({ c, count: countOf(c) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => a.c.order - b.c.order || b.count - a.count);

  return Promise.all(
    roots.map(async ({ c, count }) => {
      let image = c.image;
      if (!image) {
        const pi = await prisma.productImage.findFirst({
          where: {
            isMain: true,
            product: { isActive: true, categoryId: { in: descendantIds(c) } },
          },
          select: { url: true },
        });
        image = pi?.url ?? null;
      }
      return {
        slug: c.slug,
        name: pickTranslation(c.translations, locale)?.name ?? c.slug,
        count,
        image,
      };
    }),
  );
});

// ---------------------------------------------------------------------------
// Markalar (aktif ürünü olan, ürün sayısıyla)
// ---------------------------------------------------------------------------

export const getBrands = cached("brands", async (): Promise<BrandFilter[]> => {
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
});

// ---------------------------------------------------------------------------
// Ürün listesi (filtre + sıralama + sayfalama)
// ---------------------------------------------------------------------------

/**
 * Seçilen kategori slug'ı + TÜM alt kategorilerinin (özyinelemeli, her seviye)
 * id'lerini döndürür. Ağaç 3+ seviye olabildiği için doğrudan çocuklar yetmez;
 * ana kategoriye basınca torun kategorilerin ürünleri de gelmeli.
 * Önbellekteki kategori tablosundan çözülür — DB'ye gitmez.
 */
async function resolveCategoryIds(slug: string): Promise<string[]> {
  const all = await getCategoryRows();
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];

  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (!c.parentId) continue;
    const arr = childrenOf.get(c.parentId);
    if (arr) arr.push(c.id);
    else childrenOf.set(c.parentId, [c.id]);
  }

  const ids: string[] = [];
  const stack = [root.id];
  while (stack.length > 0) {
    const id = stack.pop()!;
    ids.push(id);
    for (const child of childrenOf.get(id) ?? []) stack.push(child);
  }
  return ids;
}

/**
 * The part of the filters that decides WHICH products match — sort and page
 * only order and slice them. Brands are de-duplicated and sorted, the search
 * term normalised, so equivalent URLs share one cache entry.
 */
type MatchKey = {
  kategori: string | null;
  marka: string[];
  q: string | null;
  qmod: QMode;
};

function matchKey(f: ProductFilters): MatchKey {
  const q = normalizeSearch(f.q);
  return {
    kategori: f.kategori ?? null,
    marka: [...new Set(f.marka)].sort(),
    q,
    qmod: q ? f.qmod : "tumu",
  };
}

// A one-letter search matches half the catalogue and is rarely repeated; it
// runs uncached so it does not mint an entry per letter.
const MIN_CACHED_QUERY = 2;

function isCacheable(k: MatchKey): boolean {
  return k.q === null || k.q.length >= MIN_CACHED_QUERY;
}

async function whereFor(k: MatchKey): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (k.kategori) {
    const ids = await resolveCategoryIds(k.kategori);
    where.categoryId = { in: ids.length > 0 ? ids : ["__none__"] };
  }
  if (k.marka.length > 0) {
    where.brand = { slug: { in: k.marka } };
  }
  if (k.q) {
    const q = k.q;
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
    if (k.qmod === "oem") {
      where.OR = byOem ? [byOem] : [{ id: "__none__" }];
    } else if (k.qmod === "kategori") {
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
  return where;
}

const cardInclude = {
  translations: true,
  images: { orderBy: [{ isMain: "desc" }, { order: "asc" }] },
  oemReferences: { orderBy: { oemNumber: "asc" } },
  category: { include: { translations: true } },
  brand: true,
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: CardRow, locale: Locale): ProductCardView {
  return {
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
  };
}

const ORDER_BY: Record<Exclude<SortValue, "ad">, Prisma.ProductOrderByWithRelationInput[]> = {
  yeni: [{ createdAt: "desc" }],
  ref: [{ sku: "asc" }],
  // one-cikan: admin manuel sırası önce
  "one-cikan": [{ sortOrder: "asc" }, { isFeatured: "desc" }, { createdAt: "desc" }, { sku: "asc" }],
};

async function countMatches(k: MatchKey): Promise<number> {
  return prisma.product.count({ where: await whereFor(k) });
}

async function loadPage(
  k: MatchKey,
  sirala: SortValue,
  page: number,
  locale: Locale,
): Promise<ProductCardView[]> {
  const where = await whereFor(k);
  const start = (page - 1) * PER_PAGE;

  // "Ad" sıralaması çeviri tablosuna bağlı → DB'de orderBy zor; JS'te yapılır.
  // Sıralama için yalnız id + ad çekilir; tam kart verisi sadece bu sayfanın
  // 24 ürünü için yüklenir (önceden eşleşen TÜM ürünler include ile geliyordu).
  if (sirala === "ad") {
    const all = await prisma.product.findMany({
      where,
      select: { id: true, sku: true, translations: { select: { locale: true, name: true } } },
    });
    const ids = all
      .map((p) => ({ id: p.id, name: pickTranslation(p.translations, locale)?.name ?? p.sku }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"))
      .slice(start, start + PER_PAGE)
      .map((p) => p.id);
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: cardInclude,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [toCard(row, locale)] : [];
    });
  }

  const rows = await prisma.product.findMany({
    where,
    include: cardInclude,
    orderBy: ORDER_BY[sirala],
    skip: start,
    take: PER_PAGE,
  });
  return rows.map((p) => toCard(p, locale));
}

const cachedCount = cached("count", countMatches);
const cachedPage = cached("page", loadPage);

export async function getProducts(
  filters: ProductFilters,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ProductListResult> {
  const key = matchKey(filters);
  const useCache = isCacheable(key);

  const total = await (useCache ? cachedCount(key) : countMatches(key));
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  // Clamped before it reaches the cache key: `?sayfa=999999` lands on the last
  // real page's entry instead of minting a new one per number.
  const page = Math.min(filters.sayfa, totalPages);

  const items = await (useCache
    ? cachedPage(key, filters.sirala, page, locale)
    : loadPage(key, filters.sirala, page, locale));

  return { items, total, page, perPage: PER_PAGE, totalPages };
}

// ---------------------------------------------------------------------------
// Ürün detay (slug ile) + benzer ürünler
// ---------------------------------------------------------------------------

export function getProductDetail(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ProductDetailView | null> {
  return cachedDetail(slug, locale);
}

// Unknown slugs cache their `null` too: a repeated 404 costs no query.
const cachedDetail = cached("detail", async (
  slug: string,
  locale: Locale,
): Promise<ProductDetailView | null> => {
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
});

export function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  locale: Locale = DEFAULT_LOCALE,
  take = 4,
): Promise<ProductCardView[]> {
  return cachedRelated(categoryId, excludeId, locale, take);
}

const cachedRelated = cached("related", async (
  categoryId: string,
  excludeId: string,
  locale: Locale,
  take: number,
): Promise<ProductCardView[]> => {
  const rows = await prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: excludeId } },
    take,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: cardInclude,
  });
  return rows.map((p) => toCard(p, locale));
});

/** Detay sayfası için categoryId gerekiyor (benzer ürünler). */
export async function getProductCategoryId(
  slug: string,
): Promise<{ id: string; categoryId: string } | null> {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true, categoryId: true },
  });
}
