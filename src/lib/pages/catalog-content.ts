import "server-only";

import { cache } from "react";
import type { Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import {
  CATALOG_PAGE,
  CATALOG_SECTIONS,
  type CatalogBannerData,
  type CatalogCardData,
  type ProductDetailData,
} from "./catalog-sections";
import { pickLocalized } from "./i18n-picker";

export type CatalogLabels = {
  banner: CatalogBannerData;
  card: CatalogCardData;
  detail: ProductDetailData;
};

function seedData<T>(key: string): T {
  return CATALOG_SECTIONS.find((s) => s.key === key)!.data as T;
}

// Tek sorgu; React cache ile aynı render'da tekrarlanmaz (liste + detay aynı isteği paylaşabilir).
export const getCatalogLabels = cache(
  async (locale: Locale = DEFAULT_LOCALE): Promise<CatalogLabels> => {
    const bannerSeed = seedData<CatalogBannerData>("banner");
    const cardSeed = seedData<CatalogCardData>("card");
    const detailSeed = seedData<ProductDetailData>("detail");
    const fallback: CatalogLabels = {
      banner: pickLocalized(bannerSeed as Record<string, unknown>, locale) as CatalogBannerData,
      card: pickLocalized(cardSeed as Record<string, unknown>, locale) as CatalogCardData,
      detail: pickLocalized(detailSeed as Record<string, unknown>, locale) as ProductDetailData,
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

    const byKey = new Map(page.sections.map((s) => [s.key, s.data as Record<string, unknown>]));
    const banner = byKey.get("banner");
    const card = byKey.get("card");
    const detail = byKey.get("detail");
    return {
      banner: banner
        ? (pickLocalized(banner, locale) as CatalogBannerData)
        : fallback.banner,
      card: card
        ? (pickLocalized(card, locale) as CatalogCardData)
        : fallback.card,
      detail: detail
        ? (pickLocalized(detail, locale) as ProductDetailData)
        : fallback.detail,
    };
  },
);
