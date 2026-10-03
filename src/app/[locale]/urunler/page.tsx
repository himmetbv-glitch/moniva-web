import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  getBrands,
  getCategorySlugs,
  getCategoryTree,
  getProducts,
  getShowcaseCategories,
} from "@/lib/products/queries";
import {
  filtersToQuery,
  parseProductFilters,
  sanitizeFilters,
} from "@/lib/validation/product-filters";
import { getCatalogLabels } from "@/lib/pages/catalog-content";
import { toDbLocale } from "@/lib/i18n-runtime";
import { PageBanner } from "./PageBanner";
import { Sidebar } from "./Sidebar";
import { ProductGrid } from "./ProductGrid";
import { CategoryShowcase } from "./CategoryShowcase";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

// Every filtered, sorted or paged variant stays out of the index; its links are
// still followed so the products behind them get found. robots.txt closes
// `/*?*` too — this covers crawlers that land here anyway.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  return Object.keys(sp).length > 0 ? { robots: { index: false, follow: true } } : {};
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const locale = toDbLocale(await getLocale());

  // All cached — none of these touch the database on a warm request.
  const [tree, brands, labels, categorySlugs] = await Promise.all([
    getCategoryTree(locale),
    getBrands(),
    getCatalogLabels(locale),
    getCategorySlugs(),
  ]);

  // Only slugs the catalogue really has survive, so the combinations a crawler
  // can produce — and the cache entries behind them — stay finite.
  const filters = sanitizeFilters(parseProductFilters(sp), {
    brands: brands.map((b) => b.slug),
    categories: categorySlugs,
  });

  // "Tüm Ürünler" kartı vitrini atlar; filtre/arama yokken kategori vitrini göster.
  const showAll = sp.tum === "1";
  const showShowcase =
    !showAll && !filters.kategori && filters.marka.length === 0 && !filters.q;

  const [result, showcaseCats] = await Promise.all([
    showShowcase ? Promise.resolve(null) : getProducts(filters, locale),
    showShowcase ? getShowcaseCategories(locale) : Promise.resolve([]),
  ]);

  // Filter, sort and page links are built from this, never from the raw URL:
  // unknown parameters and out-of-range pages do not propagate.
  const query = filtersToQuery(result ? { ...filters, sayfa: result.page } : filters, {
    all: showAll,
  });

  const totalProducts = tree.reduce((sum, r) => sum + r.count, 0);

  const findCategoryName = (slug: string): string | undefined => {
    for (const root of tree) {
      if (root.slug === slug) return root.name;
      const child = root.children.find((c) => c.slug === slug);
      if (child) return child.name;
    }
    return undefined;
  };

  const categoryLabel = filters.kategori
    ? findCategoryName(filters.kategori)
    : undefined;
  const brandLabels = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  return (
    <>
      <SiteHeader />
      <PageBanner total={totalProducts} banner={labels.banner} />
      <div className="catalog">
        <Sidebar
          query={query}
          tree={tree}
          brands={brands}
          activeCategory={filters.kategori}
          activeBrands={filters.marka}
        />
        {showShowcase ? (
          <CategoryShowcase categories={showcaseCats} total={totalProducts} />
        ) : (
          <ProductGrid
            query={query}
            result={result!}
            filters={filters}
            categoryLabel={categoryLabel}
            brandLabels={brandLabels}
            card={labels.card}
          />
        )}
      </div>
      <SiteFooter />
    </>
  );
}
