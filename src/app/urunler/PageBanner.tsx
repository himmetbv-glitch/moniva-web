import Link from "next/link";

import type { CatalogBannerData } from "@/lib/pages/catalog-sections";

export function PageBanner({
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
  const stats: [string, string][] = [
    [total.toLocaleString("tr-TR"), banner.statProduct],
    [String(families), banner.statFamily],
    [String(brands), banner.statBrand],
  ];

  return (
    <div className="banner">
      <div className="banner-crumb">
        <Link href="/">Ana Sayfa</Link>
        <span>›</span>
        <b>{banner.crumbLabel}</b>
      </div>
      <div className="banner-row">
        <div>
          <div className="banner-kicker">━━ {banner.kicker}</div>
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
