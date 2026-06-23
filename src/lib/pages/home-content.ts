import "server-only";

import type { Locale, NewsStatus, SectionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { getHomeData, type HomeData } from "@/lib/home/queries";
import { HOME_PAGE, HOME_SECTIONS } from "./home-sections";

export type CategoryOption = { slug: string; name: string };

// Aktif kategoriler (slug + yerelleştirilmiş ad) — küratörlü kart seçimi + render çözümü.
export async function getCategoryOptions(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CategoryOption[]> {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { slug: true, translations: { select: { locale: true, name: true } } },
  });
  return cats.map((c) => ({
    slug: c.slug,
    name: pickTranslation(c.translations, locale)?.name ?? c.slug,
  }));
}

export type RenderedSection = {
  key: string;
  type: SectionType;
  data: Record<string, unknown>;
};

export type HomeContent = {
  status: NewsStatus;
  seoTitle: string | null;
  seoDesc: string | null;
  sections: RenderedSection[]; // yalnızca görünür, sıralı
  dynamic: HomeData; // kategori kartları, öne çıkan ürünler, haberler
  categories: CategoryOption[]; // küratörlü kart slug→ad çözümü
};

export async function getHomeSeo(): Promise<{
  seoTitle: string | null;
  seoDesc: string | null;
  canonical: string | null;
}> {
  const page = await prisma.managedPage.findUnique({
    where: { key: HOME_PAGE.key },
    select: { seoTitle: true, seoDesc: true, canonical: true },
  });
  return {
    seoTitle: page?.seoTitle ?? HOME_PAGE.seoTitle,
    seoDesc: page?.seoDesc ?? HOME_PAGE.seoDesc,
    canonical: page?.canonical ?? null,
  };
}

// Görünür bölümleri DB'den yükler; satır yoksa seed sabitlerine düşer (site asla boş kalmaz).
export async function getHomeContent(): Promise<HomeContent> {
  const [page, dynamic, categories] = await Promise.all([
    prisma.managedPage.findUnique({
      where: { key: HOME_PAGE.key },
      include: {
        sections: {
          where: { visible: true },
          orderBy: { order: "asc" },
          select: { key: true, type: true, data: true },
        },
      },
    }),
    getHomeData(),
    getCategoryOptions(),
  ]);

  if (!page) {
    return {
      status: "PUBLISHED",
      seoTitle: HOME_PAGE.seoTitle,
      seoDesc: HOME_PAGE.seoDesc,
      sections: HOME_SECTIONS.filter((s) => s.visible).map((s) => ({
        key: s.key,
        type: s.type,
        data: s.data,
      })),
      dynamic,
      categories,
    };
  }

  return {
    status: page.status,
    seoTitle: page.seoTitle,
    seoDesc: page.seoDesc,
    sections: page.sections.map((s) => ({
      key: s.key,
      type: s.type,
      data: (s.data ?? {}) as Record<string, unknown>,
    })),
    dynamic,
    categories,
  };
}
