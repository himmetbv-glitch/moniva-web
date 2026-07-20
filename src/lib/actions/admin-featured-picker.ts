"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { normalizeOem } from "@/lib/products/normalize-oem";

export type PickerProduct = {
  id: string;
  sku: string;
  name: string;
  imageUrl: string | null;
};

const pickerSelect = {
  id: true,
  sku: true,
  translations: { select: { locale: true, name: true } },
  images: { where: { isMain: true }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

type Row = Prisma.ProductGetPayload<{ select: typeof pickerSelect }>;

function toPicker(p: Row): PickerProduct {
  return {
    id: p.id,
    sku: p.sku,
    name: pickTranslation(p.translations, DEFAULT_LOCALE)?.name ?? p.sku,
    imageUrl: p.images[0]?.url ?? null,
  };
}

/** Ad / SKU / OEM ile ürün arama (picker autocomplete). En fazla 12 sonuç. */
export async function searchFeaturedProducts(q: string): Promise<PickerProduct[]> {
  await verifyAdmin();
  const term = q.trim();
  if (term.length < 2) return [];

  const or: Prisma.ProductWhereInput[] = [
    { sku: { contains: term, mode: "insensitive" } },
    { translations: { some: { name: { contains: term, mode: "insensitive" } } } },
  ];
  const qNorm = normalizeOem(term);
  if (qNorm) {
    or.push({ oemReferences: { some: { oemNumberNormalized: { contains: qNorm } } } });
  }

  const rows = await prisma.product.findMany({
    where: { isActive: true, OR: or },
    take: 12,
    orderBy: { updatedAt: "desc" },
    select: pickerSelect,
  });
  return rows.map(toPicker);
}

/** Seçili id'lerin gösterim bilgisini (seçilen sırayla) döndürür. */
export async function getFeaturedProductsByIds(ids: string[]): Promise<PickerProduct[]> {
  await verifyAdmin();
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: pickerSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, toPicker(r)]));
  return ids.map((id) => byId.get(id)).filter((p): p is PickerProduct => Boolean(p));
}
