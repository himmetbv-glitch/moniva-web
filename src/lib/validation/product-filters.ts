import { z } from "zod";

export const SORT_VALUES = ["one-cikan", "yeni", "ref", "ad"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

// Arama kapsamı: q metni hangi alanlarda aranır.
export const QMODES = ["tumu", "kategori", "oem"] as const;
export type QMode = (typeof QMODES)[number];

// UI etiketleri artık messages/*.json'daki `product.search.modes.*` ve
// `product.grid.sorts.*` altında yönetilir — kod tarafında sadece key kalır.

export const MAX_QUERY_LENGTH = 100;

const toArray = (v: unknown): string[] =>
  v == null ? [] : Array.isArray(v) ? v.map(String) : [String(v)];

// searchParams gevşek gelir; geçersiz değerler güvenli varsayılana düşer (.catch).
export const productFiltersSchema = z.object({
  kategori: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  marka: z.preprocess(toArray, z.array(z.string().trim()).catch([])),
  // Over-long input is cut, not rejected: a parse error here used to 500 the page.
  q: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v.slice(0, MAX_QUERY_LENGTH) : undefined)),
  qmod: z.enum(QMODES).catch("tumu"),
  sirala: z.enum(SORT_VALUES).catch("ref"),
  sayfa: z.coerce.number().int().min(1).catch(1),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;

/** Next searchParams (Record<string,string|string[]>) → doğrulanmış filtreler. */
export function parseProductFilters(
  raw: Record<string, string | string[] | undefined>,
): ProductFilters {
  return productFiltersSchema.parse({
    kategori: raw.kategori,
    marka: raw.marka,
    q: raw.q,
    qmod: raw.qmod,
    sirala: raw.sirala,
    sayfa: raw.sayfa,
  });
}

/** More than this many brands at once is not a real search. */
export const MAX_MULTI_SELECT = 10;

/**
 * Drops every slug that names no real brand or category, de-duplicates and
 * caps the brand list. The listing is cached per filter combination, so the
 * set of combinations has to be finite: only values the catalogue actually
 * contains survive. An unknown `kategori` falls back to no category.
 */
export function sanitizeFilters(
  f: ProductFilters,
  known: { brands: Iterable<string>; categories: Iterable<string> },
): ProductFilters {
  const brands = new Set(known.brands);
  const categories = new Set(known.categories);
  return {
    ...f,
    kategori: f.kategori && categories.has(f.kategori) ? f.kategori : undefined,
    marka: [...new Set(f.marka)].filter((b) => brands.has(b)).sort().slice(0, MAX_MULTI_SELECT),
    // Without a term the scope selector means nothing.
    qmod: f.q ? f.qmod : "tumu",
  };
}

/**
 * The search term as it goes into the cache key and the query: lower-cased,
 * inner whitespace collapsed, at most 100 characters. Postgres ILIKE folds case
 * on its own (production collation C.UTF-8 folds Turkish letters too), so
 * "DİNGİL", "dingil" and " Dingil " return the same rows and now share one
 * cache entry. "İ" is mapped by hand: JS lower-cases it to "i" + U+0307.
 */
export function normalizeSearch(q: string | undefined): string | null {
  if (!q) return null;
  const n = q
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
  return n.length > 0 ? n : null;
}

/**
 * The canonical query string for a filter set — what the sidebar and grid
 * build their filter, sort and page links from. Defaults are left out, and
 * anything the listing does not understand (tracking tags, junk) never
 * propagates into the next link a crawler would follow.
 */
export function filtersToQuery(f: ProductFilters, opts: { all?: boolean } = {}): string {
  const p = new URLSearchParams();
  if (opts.all) p.set("tum", "1");
  if (f.q) p.set("q", f.q);
  if (f.q && f.qmod !== "tumu") p.set("qmod", f.qmod);
  if (f.kategori) p.set("kategori", f.kategori);
  for (const b of f.marka) p.append("marka", b);
  if (f.sirala !== "ref") p.set("sirala", f.sirala);
  if (f.sayfa > 1) p.set("sayfa", String(f.sayfa));
  return p.toString();
}
