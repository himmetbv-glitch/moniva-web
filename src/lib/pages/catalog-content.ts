import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import {
  CATALOG_PAGE,
  CATALOG_SECTIONS,
  type CatalogBannerData,
  type CatalogCardData,
  type ProductDetailData,
} from "./catalog-sections";

export type CatalogLabels = {
  banner: CatalogBannerData;
  card: CatalogCardData;
  detail: ProductDetailData;
};

function seedData<T>(key: string): T {
  return CATALOG_SECTIONS.find((s) => s.key === key)!.data as T;
}

// Tek sorgu; React cache ile aynı render'da tekrarlanmaz (liste + detay aynı isteği paylaşabilir).
export const getCatalogLabels = cache(async (): Promise<CatalogLabels> => {
  const fallback: CatalogLabels = {
    banner: seedData<CatalogBannerData>("banner"),
    card: seedData<CatalogCardData>("card"),
    detail: seedData<ProductDetailData>("detail"),
  };

  const page = await prisma.managedPage.findUnique({
    where: { key: CATALOG_PAGE.key },
    select: {
      sections: {
        where: { visible: true },
        select: { key: true, data: true },
      },
    },
  });
  if (!page) return fallback;

  const byKey = new Map(page.sections.map((s) => [s.key, s.data]));
  return {
    banner: (byKey.get("banner") as CatalogBannerData | undefined) ?? fallback.banner,
    card: (byKey.get("card") as CatalogCardData | undefined) ?? fallback.card,
    detail: (byKey.get("detail") as ProductDetailData | undefined) ?? fallback.detail,
  };
});
