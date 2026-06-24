"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { normalizeOem } from "@/lib/products/normalize-oem";

export type QuoteProductHit = {
  id: string;
  sku: string;
  name: string;
  oem: string | null;
};

/**
 * Lightweight product lookup for the admin Hızlı Teklif builder.
 * Matches SKU / name / OEM (separator-insensitive, same rule as the public
 * catalogue search) and returns only the fields the quote needs.
 */
export async function searchProductsForQuote(
  query: string,
): Promise<QuoteProductHit[]> {
  await verifyAdmin();

  const q = query.trim();
  if (q.length < 2) return [];

  const qNorm = normalizeOem(q);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { sku: { contains: q, mode: "insensitive" } },
      { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
      ...(qNorm
        ? [{ oemReferences: { some: { oemNumberNormalized: { contains: qNorm } } } }]
        : []),
    ],
  };

  const rows = await prisma.product.findMany({
    where,
    take: 10,
    orderBy: [{ isFeatured: "desc" }, { sku: "asc" }],
    select: {
      id: true,
      sku: true,
      translations: { select: { locale: true, name: true } },
      oemReferences: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { manufacturer: true, oemNumber: true },
      },
    },
  });

  return rows.map((p) => {
    const ref = p.oemReferences[0];
    return {
      id: p.id,
      sku: p.sku,
      name: pickTranslation(p.translations, DEFAULT_LOCALE)?.name ?? p.sku,
      oem: ref ? [ref.manufacturer, ref.oemNumber].filter(Boolean).join(" ") : null,
    };
  });
}
