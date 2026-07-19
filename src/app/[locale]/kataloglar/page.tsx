import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";
import { getPublishedCatalogues, type PublicCatalogue } from "@/lib/catalogues/queries";
import "./kataloglar.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogs" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

function CatalogueCard({
  c,
  labels,
}: {
  c: PublicCatalogue;
  labels: {
    featured: string;
    download: string;
    preview: string;
    pageSuffix: string;
  };
}) {
  const dl = `/api/catalogues/${c.id}/download`;
  return (
    <div className="cat-card">
      <div
        className="cat-card__cover"
        style={{ background: c.coverImage ? undefined : c.typeColor }}
      >
        {c.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverImage} alt={c.title} className="cat-card__coverimg" />
        ) : (
          <div className="cat-card__brand">
            <span className="cat-card__grid" aria-hidden />
            {c.featured && (
              <span className="cat-card__feat">{labels.featured}</span>
            )}
            <div className="cat-card__brandtop">MONIVA</div>
            <div className="cat-card__brandtitle">{c.title}</div>
            <div className="cat-card__brandbar">
              <span>
                PDF
                {c.pageCount ? ` · ${c.pageCount}${labels.pageSuffix}` : ""} ·{" "}
                {c.sizeLabel}
              </span>
              {c.version && <span className="cat-card__ver">{c.version}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="cat-card__body">
        <div className="cat-card__tags">
          <span className="cat-card__type" style={{ color: c.typeColor }}>
            {c.typeName}
          </span>
          {c.languages.map((l) => (
            <span key={l} className="cat-card__lang">
              {l}
            </span>
          ))}
        </div>
        {c.description && <p className="cat-card__desc">{c.description}</p>}
        <div className="cat-card__actions">
          <a className="cat-card__dl" href={dl}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5V9M7 9L4 6M7 9L10 6M2 12h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {labels.download}
          </a>
          <a className="cat-card__preview" href={dl} target="_blank" rel="noreferrer">
            {labels.preview}
          </a>
        </div>
      </div>
    </div>
  );
}

function Group({
  title,
  items,
  labels,
}: {
  title: string;
  items: PublicCatalogue[];
  labels: {
    featured: string;
    download: string;
    preview: string;
    pageSuffix: string;
  };
}) {
  if (items.length === 0) return null;
  return (
    <section className="cat-group">
      <div className="cat-grouphead">
        <h2 className="cat-grouphead__t">{title}</h2>
        <span className="cat-grouphead__rule" />
      </div>
      <div className="cat-grid">
        {items.map((c) => (
          <CatalogueCard key={c.id} c={c} labels={labels} />
        ))}
      </div>
    </section>
  );
}

export default async function CataloguesPage() {
  const [{ catalogues, types, stats }, t] = await Promise.all([
    getPublishedCatalogues(),
    getTranslations(),
  ]);

  const featured = catalogues.filter((c) => c.featured);
  const byType = types.map((tp) => ({
    name: tp.name,
    items: catalogues.filter((c) => c.typeId === tp.id && !c.featured),
  }));

  const bannerStats: [string, string][] = [
    [String(stats.count), t("catalogs.banner.statPdf")],
    [
      String(stats.languages.length || "—"),
      t("catalogs.banner.statLanguage"),
    ],
    [stats.maxPages ? String(stats.maxPages) : "—", t("catalogs.banner.statPages")],
  ];

  const cardLabels = {
    featured: t("catalogs.card.featured"),
    download: t("catalogs.card.download"),
    preview: t("catalogs.card.preview"),
    pageSuffix: t("catalogs.card.pageSuffix"),
  };

  return (
    <>
      <SiteHeader />
      <main className="cat-page">
        <section className="cat-banner">
          <div className="cat-banner__grid" aria-hidden />
          <div className="cat-banner__inner">
            <nav className="cat-crumb">
              <Link href="/">{t("crumb.home")}</Link>
              <span>›</span>
              <span className="cat-crumb__cur">{t("catalogs.crumbSelf")}</span>
            </nav>
            <div className="cat-banner__row">
              <div>
                <div className="cat-eyebrow">{t("catalogs.banner.eyebrow")}</div>
                <h1 className="cat-banner__title">{t("catalogs.banner.title")}</h1>
                <p className="cat-banner__sub">{t("catalogs.banner.sub")}</p>
              </div>
              <div className="cat-banner__stats">
                {bannerStats.map(([v, l]) => (
                  <div key={l} className="cat-bstat">
                    <div className="cat-bstat__v">{v}</div>
                    <div className="cat-bstat__l">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {catalogues.length === 0 ? (
          <section className="cat-empty">
            <div className="cat-empty__t">{t("catalogs.empty.title")}</div>
            <p>{t("catalogs.empty.body")}</p>
          </section>
        ) : (
          <div className="cat-body">
            <Group
              title={t("catalogs.featuredGroup")}
              items={featured}
              labels={cardLabels}
            />
            {byType.map(({ name, items }) => (
              <Group key={name} title={name} items={items} labels={cardLabels} />
            ))}

            <div className="cat-printcta">
              <div>
                <div className="cat-printcta__t">{t("catalogs.printCta.title")}</div>
                <p>{t("catalogs.printCta.body")}</p>
              </div>
              <Link href="/iletisim" className="cat-printcta__btn">
                {t("catalogs.printCta.cta")}
              </Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
