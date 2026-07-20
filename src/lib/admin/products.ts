import "server-only";

import { type Locale, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { buildCategoryTreeOptions } from "./category-tree-options";

export const ADMIN_PER_PAGE = 20;

export type AdminProductRow = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  brand: string | null;
  isActive: boolean;
  isFeatured: boolean;
  oemCount: number;
  compatCount: number;
  imageUrl: string | null;
  updatedLabel: string;
};

export type AdminProductFilters = {
  q?: string;
  status?: "active" | "inactive";
  featured?: boolean;
  kategori?: string;
  marka?: string;
  sort?: "guncel" | "sira";
  page?: number;
};

export type AdminCategoryOption = { slug: string; name: string };

export type AdminProductListResult = {
  rows: AdminProductRow[];
  total: number;
  page: number;
  pageCount: number;
  counts: { products: number; categories: number; brands: number; rfq30d: number };
  categoryOptions: AdminCategoryOption[];
};

/** getAdminProducts ve sıralama action'ı aynı filtre mantığını paylaşır. */
export function buildProductWhere(filters: AdminProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;
  if (filters.featured) where.isFeatured = true;
  if (filters.kategori) where.category = { slug: filters.kategori };
  if (filters.marka) where.brand = { slug: filters.marka };
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    where.OR = [
      { sku: { contains: term, mode: "insensitive" } },
      { translations: { some: { name: { contains: term, mode: "insensitive" } } } },
      { oemReferences: { some: { oemNumber: { contains: term, mode: "insensitive" } } } },
    ];
  }
  return where;
}

function relativeLabel(date: Date, now: number): string {
  const min = Math.round((now - date.getTime()) / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "dün";
  if (d < 7) return `${d} gün önce`;
  return `${Math.floor(d / 7)} hf önce`;
}

export async function getAdminProducts(
  filters: AdminProductFilters,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AdminProductListResult> {
  const now = Date.now();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const page = Math.max(1, filters.page ?? 1);

  const where = buildProductWhere(filters);

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    filters.sort === "sira"
      ? [{ sortOrder: "asc" }, { createdAt: "desc" }, { sku: "asc" }]
      : [{ updatedAt: "desc" }];

  const [rows, total, products, categories, brands, rfq30d, categoryRows] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * ADMIN_PER_PAGE,
      take: ADMIN_PER_PAGE,
      select: {
        id: true,
        sku: true,
        slug: true,
        isActive: true,
        isFeatured: true,
        updatedAt: true,
        translations: { select: { locale: true, name: true } },
        category: { select: { translations: { select: { locale: true, name: true } }, slug: true } },
        brand: { select: { name: true } },
        images: { where: { isMain: true }, take: 1, select: { url: true } },
        _count: { select: { oemReferences: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.quoteRequest.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        parentId: true,
        order: true,
        translations: { select: { locale: true, name: true } },
      },
    }),
  ]);

  return {
    rows: rows.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: pickTranslation(p.translations, locale)?.name ?? p.sku,
      category: pickTranslation(p.category.translations, locale)?.name ?? p.category.slug,
      brand: p.brand?.name ?? null,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      oemCount: p._count.oemReferences,
      compatCount: p._count.oemReferences,
      imageUrl: p.images[0]?.url ?? null,
      updatedLabel: relativeLabel(p.updatedAt, now),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PER_PAGE)),
    counts: { products, categories, brands, rfq30d },
    categoryOptions: buildCategoryTreeOptions(
      categoryRows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: pickTranslation(c.translations, locale)?.name ?? c.slug,
        parentId: c.parentId,
        order: c.order,
      })),
    ).map((c) => ({ slug: c.slug, name: c.label })),
  };
}
