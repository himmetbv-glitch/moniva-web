import "server-only";

import type { Locale, NewsStatus, SectionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { buildCategoryTreeOptions } from "@/lib/admin/category-tree-options";
import { getHomeData, type HomeData } from "@/lib/home/queries";
import { HOME_PAGE, HOME_SECTIONS } from "./home-sections";
import { pickLocalized } from "./i18n-picker";

// `name` düz addır (public kartlarda başlık olarak basılır); `label` ise ağaç
// sırasına göre girintili etikettir ve yalnızca admin dropdown'larında kullanılır.
export type CategoryOption = { slug: string; name: string; label: string };

// Aktif kategoriler (slug + yerelleştirilmiş ad) — küratörlü kart seçimi + render çözümü.
// Sıra hiyerarşiktir (ebeveyn → çocukları) ki panelde aynı adlı alt kategoriler
// (UZUN, KISA, DİSK…) hangi ana kategoriye ait olduğu görünsün.
export async function getCategoryOptions(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CategoryOption[]> {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      parentId: true,
      order: true,
      translations: { select: { locale: true, name: true } },
    },
  });
  return buildCategoryTreeOptions(
    cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: pickTranslation(c.translations, locale)?.name ?? c.slug,
      parentId: c.parentId,
      order: c.order,
    })),
  ).map((c) => ({ slug: c.slug, name: c.name, label: c.label }));
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
// locale parametresi section.data içindeki _i18n override'ını uygular (TR default).
export async function getHomeContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<HomeContent> {
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
    getCategoryOptions(locale),
  ]);

  if (!page) {
    return {
      status: "PUBLISHED",
      seoTitle: HOME_PAGE.seoTitle,
      seoDesc: HOME_PAGE.seoDesc,
      sections: HOME_SECTIONS.filter((s) => s.visible).map((s) => ({
        key: s.key,
        type: s.type,
        data: pickLocalized(s.data as Record<string, unknown>, locale),
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
      data: pickLocalized((s.data ?? {}) as Record<string, unknown>, locale),
    })),
    dynamic,
    categories,
  };
}
