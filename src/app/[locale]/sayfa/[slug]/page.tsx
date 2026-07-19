import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";
import { getPageBySlug } from "@/lib/pages/queries";
import "./sayfa.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPageBySlug(slug);
  const t = await getTranslations({ locale, namespace: "page" });
  if (!page) return { title: t("notFoundTitle") };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || undefined,
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const t = await getTranslations();

  return (
    <div className="page-page">
      <SiteHeader />

      <section className="pg-banner">
        <div className="pg-banner__grid" />
        <div className="pg-banner__inner">
          <nav className="pg-crumb">
            <Link href="/">{t("crumb.home")}</Link>
            <span>/</span>
            <span className="pg-crumb__cur">{page.title}</span>
          </nav>
          <h1 className="pg-banner__title">{page.title}</h1>
        </div>
      </section>

      <article className="pg-article">
        {page.paragraphs.length > 0 ? (
          page.paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="pg-muted">{t("page.empty")}</p>
        )}
        <div className="pg-updated">
          {t("page.lastUpdated")} {page.updatedLabel}
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
