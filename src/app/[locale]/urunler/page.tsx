import { getLocale } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  getBrands,
  getCategoryTree,
  getProducts,
  getShowcaseCategories,
} from "@/lib/products/queries";
import { parseProductFilters } from "@/lib/validation/product-filters";
import { getCatalogLabels } from "@/lib/pages/catalog-content";
import { toDbLocale } from "@/lib/i18n-runtime";
import { PageBanner } from "./PageBanner";
import { Sidebar } from "./Sidebar";
import { ProductGrid } from "./ProductGrid";
import { CategoryShowcase } from "./CategoryShowcase";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = parseProductFilters(sp);
  const locale = toDbLocale(await getLocale());

  // "Tüm Ürünler" kartı vitrini atlar; filtre/arama yokken kategori vitrini göster.
  const showAll = sp.tum === "1";
  const showShowcase =
    !showAll && !filters.kategori && filters.marka.length === 0 && !filters.q;

  const [result, tree, brands, labels, showcaseCats] = await Promise.all([
    showShowcase ? Promise.resolve(null) : getProducts(filters, locale),
    getCategoryTree(locale),
    getBrands(),
    getCatalogLabels(locale),
    showShowcase ? getShowcaseCategories(locale) : Promise.resolve([]),
  ]);

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
      <PageBanner
        total={totalProducts}
        families={tree.length}
        brands={brands.length}
        banner={labels.banner}
      />
      <div className="catalog">
        <Sidebar
          tree={tree}
          brands={brands}
          activeCategory={filters.kategori}
          activeBrands={filters.marka}
        />
        {showShowcase ? (
          <CategoryShowcase categories={showcaseCats} total={totalProducts} />
        ) : (
          <ProductGrid
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
