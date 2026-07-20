import "server-only";

import { NewsStatus, Prisma, type Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { getCategoryTree, type CategoryNode } from "@/lib/products/queries";
import { HOME_PAGE } from "@/lib/pages/home-sections";

// Öne çıkan ürün kartı için ortak select (otomatik + elle seçim aynı şekli döner).
const featuredSelect = {
  id: true,
  slug: true,
  sku: true,
  translations: { select: { locale: true, name: true } },
  category: { select: { translations: { select: { locale: true, name: true } }, slug: true } },
  brand: { select: { name: true } },
  oemReferences: { select: { manufacturer: true }, take: 5 },
  images: { where: { isMain: true }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

type FeaturedRow = Prisma.ProductGetPayload<{ select: typeof featuredSelect }>;

/** Anasayfa "featured" bölümünde elle seçilmiş ürün id'leri (yoksa boş). */
async function getManualFeaturedIds(): Promise<string[]> {
  const page = await prisma.managedPage.findUnique({
    where: { key: HOME_PAGE.key },
    select: { sections: { where: { key: "featured" }, select: { data: true } } },
  });
  const data = page?.sections[0]?.data as { productIds?: unknown } | undefined;
  const ids = data?.productIds;
  return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
}

export type HomeFeatured = {
  slug: string;
  sku: string;
  name: string;
  category: string;
  compat: string;
  imageUrl: string | null;
};

export type HomeNews = {
  slug: string;
  title: string;
  excerpt: string | null;
  dateLabel: string;
  imageUrl: string | null;
};

export type HomeData = {
  categoryCards: { slug: string; name: string }[];
  featured: HomeFeatured[];
  news: HomeNews[];
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export async function getHomeData(
  locale: Locale = DEFAULT_LOCALE,
): Promise<HomeData> {
  const [tree, manualIds, newsRows] = await Promise.all([
    getCategoryTree(locale),
    getManualFeaturedIds(),
    prisma.newsPost.findMany({
      where: { status: NewsStatus.PUBLISHED },
      take: 5,
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        coverImage: true,
        publishedAt: true,
        translations: { select: { locale: true, title: true, excerpt: true } },
      },
    }),
  ]);

  // 1) Elle seçim varsa: tam olarak o ürünler, seçilen sırayla (pasif/silinmiş atlanır).
  let featuredSource: FeaturedRow[] = [];
  if (manualIds.length > 0) {
    const picked = await prisma.product.findMany({
      where: { id: { in: manualIds }, isActive: true },
      select: featuredSelect,
    });
    const byId = new Map(picked.map((p) => [p.id, p]));
    featuredSource = manualIds
      .map((id) => byId.get(id))
      .filter((p): p is FeaturedRow => Boolean(p));
  }

  // 2) Elle seçim yoksa (veya hiç çözülmediyse): otomatik — önce isFeatured, azsa en yeni.
  if (featuredSource.length === 0) {
    featuredSource = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: featuredSelect,
    });
    if (featuredSource.length < 3) {
      featuredSource = await prisma.product.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: featuredSelect,
      });
    }
  }

  const featured: HomeFeatured[] = featuredSource.map((p) => {
    const manufacturers = Array.from(
      new Set(p.oemReferences.map((o) => o.manufacturer).filter(Boolean)),
    ).slice(0, 4) as string[];
    const compat =
      manufacturers.length > 0
        ? manufacturers.join(" · ")
        : (p.brand?.name ?? "Çok markalı uyumluluk");
    return {
      slug: p.slug,
      sku: p.sku,
      name: pickTranslation(p.translations, locale)?.name ?? p.sku,
      category: pickTranslation(p.category.translations, locale)?.name ?? p.category.slug,
      compat,
      imageUrl: p.images[0]?.url ?? null,
    };
  });

  const news: HomeNews[] = newsRows.map((n) => {
    const tr = pickTranslation(n.translations, locale);
    return {
      slug: n.slug,
      title: tr?.title ?? n.slug,
      excerpt: tr?.excerpt ?? null,
      dateLabel: n.publishedAt ? dateFmt.format(n.publishedAt) : "",
      imageUrl: n.coverImage ?? null,
    };
  });

  const categoryCards = pickCategoryCards(tree);

  return { categoryCards, featured, news };
}

function pickCategoryCards(tree: CategoryNode[]): { slug: string; name: string }[] {
  return tree.slice(0, 2).map((c) => ({ slug: c.slug, name: c.name }));
}
