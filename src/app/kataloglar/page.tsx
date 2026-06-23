import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getPublishedCatalogues, type PublicCatalogue } from "@/lib/catalogues/queries";
import "./kataloglar.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kataloglar — Moniva",
  description:
    "Moniva ürün gamını baskıya hazır PDF olarak indirin — genel katalog, ürün aileleri, OEM çapraz referans ve marka kılavuzları.",
};

function CatalogueCard({ c }: { c: PublicCatalogue }) {
  const dl = `/api/catalogues/${c.id}/download`;
  return (
    <div className="cat-card">
      <div className="cat-card__cover" style={{ background: c.coverImage ? undefined : c.typeColor }}>
        {c.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverImage} alt={c.title} className="cat-card__coverimg" />
        ) : (
          <div className="cat-card__brand">
            <span className="cat-card__grid" aria-hidden />
            {c.featured && <span className="cat-card__feat">ÖNE ÇIKAN</span>}
            <div className="cat-card__brandtop">MONIVA</div>
            <div className="cat-card__brandtitle">{c.title}</div>
            <div className="cat-card__brandbar">
              <span>
                PDF{c.pageCount ? ` · ${c.pageCount}s` : ""} · {c.sizeLabel}
              </span>
              {c.version && <span className="cat-card__ver">{c.version}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="cat-card__body">
        <div className="cat-card__tags">
          <span className="cat-card__type" style={{ color: c.typeColor }}>{c.typeName}</span>
          {c.languages.map((l) => (
            <span key={l} className="cat-card__lang">{l}</span>
          ))}
        </div>
        {c.description && <p className="cat-card__desc">{c.description}</p>}
        <div className="cat-card__actions">
          <a className="cat-card__dl" href={dl}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5V9M7 9L4 6M7 9L10 6M2 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            PDF İndir
          </a>
          <a className="cat-card__preview" href={dl} target="_blank" rel="noreferrer">Önizle</a>
        </div>
      </div>
    </div>
  );
}

function Group({ title, items }: { title: string; items: PublicCatalogue[] }) {
  if (items.length === 0) return null;
  return (
    <section className="cat-group">
      <div className="cat-grouphead">
        <h2 className="cat-grouphead__t">{title}</h2>
        <span className="cat-grouphead__rule" />
      </div>
      <div className="cat-grid">
        {items.map((c) => (
          <CatalogueCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

export default async function CataloguesPage() {
  const { catalogues, types, stats } = await getPublishedCatalogues();

  const featured = catalogues.filter((c) => c.featured);
  const byType = types.map((t) => ({
    name: t.name,
    items: catalogues.filter((c) => c.typeId === t.id && !c.featured),
  }));

  const bannerStats: [string, string][] = [
    [String(stats.count), "PDF"],
    [String(stats.languages.length || "—"), "Dil"],
    [stats.maxPages ? String(stats.maxPages) : "—", "Sayfa"],
  ];

  return (
    <>
      <SiteHeader />
      <main className="cat-page">
        <section className="cat-banner">
          <div className="cat-banner__grid" aria-hidden />
          <div className="cat-banner__inner">
            <nav className="cat-crumb">
              <Link href="/">Ana Sayfa</Link>
              <span>›</span>
              <span className="cat-crumb__cur">Kataloglar</span>
            </nav>
            <div className="cat-banner__row">
              <div>
                <div className="cat-eyebrow">━━ İndirilebilir Dosyalar</div>
                <h1 className="cat-banner__title">Kataloglar.</h1>
                <p className="cat-banner__sub">
                  Moniva ürün gamını baskıya hazır PDF olarak indirin — genel katalog,
                  ürün aileleri, OEM çapraz referans ve marka kılavuzları. 2026 sezonu için
                  güncellendi.
                </p>
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
            <div className="cat-empty__t">Henüz yayınlanmış katalog yok.</div>
            <p>Kataloglar hazırlandığında bu sayfadan indirebileceksiniz.</p>
          </section>
        ) : (
          <div className="cat-body">
            <Group title="Öne Çıkan Kataloglar" items={featured} />
            {byType.map(({ name, items }) => (
              <Group key={name} title={name} items={items} />
            ))}

            <div className="cat-printcta">
              <div>
                <div className="cat-printcta__t">Basılı katalog ister misiniz?</div>
                <p>
                  Genel kataloğun basılı bir kopyasını iş yerinize gönderelim — kayıtlı
                  ticari iş ortakları için ücretsiz.
                </p>
              </div>
              <Link href="/iletisim" className="cat-printcta__btn">Basılı kopya isteyin ▶</Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
