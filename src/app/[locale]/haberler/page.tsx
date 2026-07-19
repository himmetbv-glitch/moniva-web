import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";
import { getPublishedNews, type PublicNewsCard } from "@/lib/news/queries";
import "./haberler.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

function CoverVisual({ post, kind }: { post: PublicNewsCard; kind: "feat" | "card" }) {
  if (post.coverImage) {
    return (
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        sizes={
          kind === "feat"
            ? "(max-width: 900px) 100vw, 50vw"
            : "(max-width: 900px) 100vw, 33vw"
        }
        style={{ objectFit: "cover" }}
      />
    );
  }
  return (
    <div className="nw-noimg" aria-hidden>
      <span className="nw-noimg__mark">moniva</span>
    </div>
  );
}

export default async function HaberlerPage() {
  const [posts, t] = await Promise.all([getPublishedNews(), getTranslations()]);
  const [featured, ...rest] = posts;

  return (
    <>
      <SiteHeader />
      <main className="news-page">
        <section className="nw-banner">
          <div className="nw-banner__grid" aria-hidden />
          <div className="nw-banner__inner">
            <nav className="nw-crumb">
              <Link href="/">{t("crumb.home")}</Link>
              <span>›</span>
              <span className="nw-crumb__cur">{t("news.crumbSelf")}</span>
            </nav>
            <div className="nw-banner__row">
              <div>
                <div className="nw-eyebrow nw-eyebrow--accent">
                  {t("news.banner.eyebrow")}
                </div>
                <h1 className="nw-banner__title">{t("news.banner.title")}</h1>
                <p className="nw-banner__sub">{t("news.banner.sub")}</p>
              </div>
              <div className="nw-banner__stats">
                {(
                  [
                    [String(posts.length), t("news.banner.statNews")],
                    ["4", t("news.banner.statLanguage")],
                    ["80+", t("news.banner.statMarket")],
                  ] as [string, string][]
                ).map(([v, l]) => (
                  <div key={l} className="nw-bstat">
                    <div className="nw-bstat__v">{v}</div>
                    <div className="nw-bstat__l">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {posts.length === 0 ? (
          <section className="nw-empty">
            <div className="nw-empty__title">{t("news.empty.title")}</div>
            <p>{t("news.empty.body")}</p>
          </section>
        ) : (
          <>
            <section className="nw-featsec">
              <div className="nw-h">
                <div className="nw-h__title">{t("news.featuredHeading")}</div>
                <div className="nw-h__rule" />
              </div>
              <Link href={`/haberler/${featured.slug}`} className="nw-feat">
                <div className="nw-feat__media">
                  <CoverVisual post={featured} kind="feat" />
                  <span className="nw-feat__badge">{t("news.featuredBadge")}</span>
                  <span className="nw-feat__date">{featured.dateLabel}</span>
                </div>
                <div className="nw-feat__copy">
                  <div className="nw-eyebrow nw-eyebrow--accent">
                    {t("news.pressReleasePrefix")} · {featured.dateLabel}
                  </div>
                  <h2 className="nw-feat__title">{featured.title}</h2>
                  {featured.excerpt && (
                    <p className="nw-feat__excerpt">{featured.excerpt}</p>
                  )}
                  <span className="nw-feat__cta">{t("news.featuredCta")}</span>
                </div>
              </Link>
            </section>

            {rest.length > 0 && (
              <section className="nw-gridsec">
                <div className="nw-h">
                  <div className="nw-h__title">{t("news.allHeading")}</div>
                  <div className="nw-h__rule" style={{ width: 130 }} />
                </div>
                <div className="nw-grid">
                  {rest.map((a) => (
                    <Link key={a.slug} href={`/haberler/${a.slug}`} className="nw-card">
                      <div className="nw-card__media">
                        <CoverVisual post={a} kind="card" />
                        <div className="nw-card__date">
                          <div className="nw-card__day">{a.day}</div>
                          <div className="nw-card__mon">{a.mon}</div>
                        </div>
                      </div>
                      <div className="nw-card__body">
                        <div className="nw-card__year">{a.year}</div>
                        <h3 className="nw-card__title">{a.title}</h3>
                        {a.excerpt && <p className="nw-card__excerpt">{a.excerpt}</p>}
                        <span className="nw-card__cta">{t("news.cardCta")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
