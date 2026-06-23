import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getPublishedNews, type PublicNewsCard } from "@/lib/news/queries";
import "./haberler.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Haberler — Moniva",
  description:
    "Moniva'dan basın bültenleri, ürün lansmanları, fuar haberleri ve sektör içgörüleri.",
};

function CoverVisual({ post, kind }: { post: PublicNewsCard; kind: "feat" | "card" }) {
  if (post.coverImage) {
    return (
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        sizes={kind === "feat" ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 900px) 100vw, 33vw"}
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
  const posts = await getPublishedNews();
  const [featured, ...rest] = posts;

  return (
    <>
      <SiteHeader />
      <main className="news-page">
        {/* Banner */}
        <section className="nw-banner">
          <div className="nw-banner__grid" aria-hidden />
          <div className="nw-banner__inner">
            <nav className="nw-crumb">
              <Link href="/">Ana Sayfa</Link>
              <span>›</span>
              <span className="nw-crumb__cur">Haberler</span>
            </nav>
            <div className="nw-banner__row">
              <div>
                <div className="nw-eyebrow nw-eyebrow--accent">━━ Basın & Medya</div>
                <h1 className="nw-banner__title">Haberler.</h1>
                <p className="nw-banner__sub">
                  Moniva Otomotiv&apos;den basın bültenleri, ürün lansmanları, fuar
                  haberleri ve sektör içgörüleri — 80+ pazara sevk ettiğimiz her parçanın
                  arkasındaki hikâye.
                </p>
              </div>
              <div className="nw-banner__stats">
                {([[String(posts.length), "Haber"], ["4", "Dil"], ["80+", "Pazar"]] as [string, string][]).map(
                  ([v, l]) => (
                    <div key={l} className="nw-bstat">
                      <div className="nw-bstat__v">{v}</div>
                      <div className="nw-bstat__l">{l}</div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {posts.length === 0 ? (
          <section className="nw-empty">
            <div className="nw-empty__title">Henüz yayınlanmış haber yok.</div>
            <p>Yakında bu sayfada Moniva&apos;dan güncellemeleri bulacaksınız.</p>
          </section>
        ) : (
          <>
            {/* Öne çıkan */}
            <section className="nw-featsec">
              <div className="nw-h">
                <div className="nw-h__title">Öne Çıkan Haber.</div>
                <div className="nw-h__rule" />
              </div>
              <Link href={`/haberler/${featured.slug}`} className="nw-feat">
                <div className="nw-feat__media">
                  <CoverVisual post={featured} kind="feat" />
                  <span className="nw-feat__badge">ÖNE ÇIKAN</span>
                  <span className="nw-feat__date">{featured.dateLabel}</span>
                </div>
                <div className="nw-feat__copy">
                  <div className="nw-eyebrow nw-eyebrow--accent">Basın Bülteni · {featured.dateLabel}</div>
                  <h2 className="nw-feat__title">{featured.title}</h2>
                  {featured.excerpt && <p className="nw-feat__excerpt">{featured.excerpt}</p>}
                  <span className="nw-feat__cta">Tüm haberi oku ▶</span>
                </div>
              </Link>
            </section>

            {/* Diğer haberler */}
            {rest.length > 0 && (
              <section className="nw-gridsec">
                <div className="nw-h">
                  <div className="nw-h__title">Tüm Haberler.</div>
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
                        <span className="nw-card__cta">Oku ▶</span>
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
