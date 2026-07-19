import { z } from "zod";

export const SORT_VALUES = ["one-cikan", "yeni", "ref", "ad"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

// Arama kapsamı: q metni hangi alanlarda aranır.
export const QMODES = ["tumu", "kategori", "oem"] as const;
export type QMode = (typeof QMODES)[number];

// UI etiketleri artık messages/*.json'daki `product.search.modes.*` ve
// `product.grid.sorts.*` altında yönetilir — kod tarafında sadece key kalır.

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
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  qmod: z.enum(QMODES).catch("tumu"),
  sirala: z.enum(SORT_VALUES).catch("one-cikan"),
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
