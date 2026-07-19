import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { CatalogBannerData } from "@/lib/pages/catalog-sections";

export async function PageBanner({
  total,
  families,
  brands,
  banner,
}: {
  total: number;
  families: number;
  brands: number;
  banner: CatalogBannerData;
}) {
  const t = await getTranslations();
  const stats: [string, string][] = [
    [total.toLocaleString("tr-TR"), banner.statProduct],
    [String(families), banner.statFamily],
    [String(brands), banner.statBrand],
  ];

  return (
    <div className="banner">
      <div className="banner-crumb">
        <Link href="/">{t("crumb.home")}</Link>
        <span>›</span>
        <b>{banner.crumbLabel}</b>
      </div>
      <div className="banner-row">
        <div>
          {banner.kicker && (
            <div className="banner-kicker">━━ {banner.kicker}</div>
          )}
          <h1 className="banner-title">{banner.title}</h1>
          <p className="banner-sub">{banner.subtitle}</p>
        </div>
        <div className="banner-stats">
          {stats.map(([v, l]) => (
            <div className="stat" key={l}>
              <div className="v">{v}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
