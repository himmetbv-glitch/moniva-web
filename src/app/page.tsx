import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/home/Hero";
import type { Metadata } from "next";

import {
  getHomeContent,
  getHomeSeo,
  type RenderedSection,
  type CategoryOption,
} from "@/lib/pages/home-content";
import type { HomeData } from "@/lib/home/queries";
import type {
  HeroData,
  CategoryGridData,
  FeatureColumnsData,
  RegionGridData,
  FeaturedProductsData,
  NewsroomData,
  PartnerMarqueeData,
  ContactCtaData,
} from "@/lib/pages/home-sections";
import "@/components/home/home.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getHomeSeo();
  return {
    title: seo.seoTitle ?? undefined,
    description: seo.seoDesc ?? undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
  };
}

const CAT_IMAGES = ["/home/cat-brake.jpg", "/home/cat-caliper.jpg"];

export default async function HomePage() {
  const content = await getHomeContent();

  return (
    <>
      <SiteHeader />
      {content.sections.map((s) => (
        <SectionRenderer
          key={s.key}
          section={s}
          dynamic={content.dynamic}
          categories={content.categories}
        />
      ))}
      <SiteFooter />
    </>
  );
}

function SectionRenderer({
  section,
  dynamic,
  categories,
}: {
  section: RenderedSection;
  dynamic: HomeData;
  categories: CategoryOption[];
}) {
  switch (section.type) {
    case "HERO":
      return <Hero {...(section.data as unknown as HeroData)} />;
    case "CATEGORY_GRID":
      return (
        <CategorySection
          data={section.data as unknown as CategoryGridData}
          dynamic={dynamic}
          categories={categories}
        />
      );
    case "FEATURE_COLUMNS":
      return <WhySection data={section.data as unknown as FeatureColumnsData} />;
    case "REGION_GRID":
      return <ReachSection data={section.data as unknown as RegionGridData} />;
    case "FEATURED_PRODUCTS":
      return <FeaturedSection data={section.data as unknown as FeaturedProductsData} dynamic={dynamic} />;
    case "NEWSROOM":
      return <NewsSection data={section.data as unknown as NewsroomData} dynamic={dynamic} />;
    case "PARTNER_MARQUEE":
      return <PartnersSection data={section.data as unknown as PartnerMarqueeData} />;
    case "CONTACT_CTA":
      return <ContactCtaSection data={section.data as unknown as ContactCtaData} />;
    default:
      return null;
  }
}

function CategorySection({
  data,
  dynamic,
  categories,
}: {
  data: CategoryGridData;
  dynamic: HomeData;
  categories: CategoryOption[];
}) {
  const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));
  const tiles = Array.isArray(data.tiles) ? data.tiles : [];

  // Küratörlü kartlar (mevcut kategoriye bağlı olanlar); yoksa otomatik ilk kategoriler.
  const cards =
    tiles.length > 0
      ? tiles
          .filter((t) => nameBySlug.has(t.categorySlug))
          .map((t, i) => ({
            slug: t.categorySlug,
            name: nameBySlug.get(t.categorySlug)!,
            image: t.image || CAT_IMAGES[i] || CAT_IMAGES[0],
          }))
      : dynamic.categoryCards.map((c, i) => ({
          slug: c.slug,
          name: c.name,
          image: CAT_IMAGES[i] ?? CAT_IMAGES[0],
        }));

  return (
    <section className="hh-sec hh-cats">
      <div className="hh-sec__head">
        <div className="hh-title">
          {data.title}
          <span className="hh-title__rule" style={{ width: data.ruleWidth }} />
        </div>
        <Link href={data.ctaHref} className="hh-seelink">
          {data.ctaLabel}
        </Link>
      </div>
      <div className="hh-cats__grid">
        {cards.map((c) => (
          <Link
            key={c.slug}
            href={`/urunler?kategori=${c.slug}`}
            className="hh-catcard"
            style={{ backgroundImage: `url(${c.image})` }}
          >
            <span className="hh-catcard__scrim" />
            <span className="hh-catcard__label">
              {c.name} <i>»</i>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function WhySection({ data }: { data: FeatureColumnsData }) {
  return (
    <section className="hh-sec hh-why">
      <div className="hh-title">
        {data.title}
        <span className="hh-title__rule" style={{ width: data.ruleWidth }} />
      </div>
      <div className="hh-why__grid">
        {data.pillars.map((p) => (
          <div className="hh-pillar" key={p.num}>
            <div className="hh-pillar__num">{p.num}</div>
            <span className="hh-pillar__tick" />
            <div className="hh-pillar__title">{p.title}</div>
            <div className="hh-pillar__body">{p.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReachSection({ data }: { data: RegionGridData }) {
  return (
    <section className="hh-sec hh-global">
      <div className="hh-global__left">
        <div className="hh-title">
          {data.title}
          <span className="hh-title__rule" style={{ width: data.ruleWidth }} />
        </div>
        <div className="hh-global__regions">
          {data.regions.map((r) => (
            <div className="hh-region" key={r.region}>
              <div className="hh-region__top">
                <span className="hh-region__name">{r.region}</span>
                <span className="hh-region__count">{r.count}</span>
              </div>
              <div className="hh-region__countries">{r.countries}</div>
            </div>
          ))}
        </div>
        <div className="hh-global__stats">
          {data.stats.map((st) => (
            <div className="hh-gstat" key={st.l}>
              <div className="hh-gstat__v">{st.v}</div>
              <div className="hh-gstat__l">{st.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="hh-global__card">
        <div className="hh-global__map">
          <Image src={data.mapImage} alt="Moniva ihracat" fill sizes="520px" style={{ objectFit: "cover" }} />
        </div>
        <Link href={data.cardHref} className="hh-global__cta">
          <div className="hh-global__cta-h">{data.cardHead}</div>
          <div className="hh-global__cta-s">{data.cardSub}</div>
        </Link>
      </div>
    </section>
  );
}

function FeaturedSection({ data, dynamic }: { data: FeaturedProductsData; dynamic: HomeData }) {
  const { featured } = dynamic;
  if (featured.length === 0) return null;
  const heroFeatured = featured[0];
  const listFeatured = featured.slice(1);

  return (
    <section className="hh-sec hh-feat">
      <div className="hh-sec__head">
        <div className="hh-title">
          {data.title}
          <span className="hh-title__rule" style={{ width: data.ruleWidth }} />
        </div>
        <Link href={data.ctaHref} className="hh-seelink">
          {data.ctaLabel}
        </Link>
      </div>
      <div className="hh-feat__row">
        {heroFeatured && (
          <Link href={`/urunler/${heroFeatured.slug}`} className="hh-feat__big">
            <div className="hh-feat__big-img">
              {heroFeatured.imageUrl ? (
                <Image src={heroFeatured.imageUrl} alt={heroFeatured.name} fill sizes="340px" style={{ objectFit: "cover" }} />
              ) : (
                <span className="hh-feat__ph">{heroFeatured.category}</span>
              )}
            </div>
            <div className="hh-feat__big-body">
              <div className="hh-feat__big-cat">{heroFeatured.category}</div>
              <div className="hh-feat__big-name">{heroFeatured.name} ▶</div>
              <div className="hh-feat__big-ref">
                Ref: {heroFeatured.sku} · {heroFeatured.compat}
              </div>
            </div>
          </Link>
        )}
        <div className="hh-feat__list">
          {listFeatured.map((p) => (
            <Link key={p.slug} href={`/urunler/${p.slug}`} className="hh-feat__item">
              <div className="hh-feat__item-img">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} width={72} height={72} style={{ objectFit: "cover", width: 72, height: "100%" }} />
                ) : (
                  <span>IMG</span>
                )}
              </div>
              <div className="hh-feat__item-body">
                <div>
                  <div className="hh-feat__item-cat">{p.category}</div>
                  <div className="hh-feat__item-name">{p.name}</div>
                  <div className="hh-feat__item-ref">Ref: {p.sku} · {p.compat}</div>
                </div>
                <span className="hh-feat__item-detail">İncele ▶</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsSection({ data, dynamic }: { data: NewsroomData; dynamic: HomeData }) {
  const { news } = dynamic;
  return (
    <section className="hh-sec hh-news">
      <div className="hh-news__main">
        <div className="hh-title">
          {data.title}
          <span className="hh-title__rule" style={{ width: data.ruleWidth }} />
        </div>
        {news.length === 0 ? (
          <div className="hh-news__empty">Haberler yakında yayımlanacak.</div>
        ) : (
          <div className="hh-news__cards">
            {news.slice(0, 2).map((n) => (
              <Link href={`/haberler/${n.slug}`} className="hh-news__card" key={n.slug}>
                <div className="hh-news__card-img">
                  {n.imageUrl && (
                    <Image src={n.imageUrl} alt={n.title} fill sizes="640px" style={{ objectFit: "cover" }} />
                  )}
                </div>
                <div className="hh-news__card-body">
                  <div className="hh-news__meta">{n.dateLabel}</div>
                  <div className="hh-news__card-title">{n.title} ▶</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="hh-news__side">
        <div className="hh-title">
          {data.sideTitle}
          <span className="hh-title__rule" style={{ width: data.sideRuleWidth }} />
        </div>
        {news.length === 0 ? (
          <div className="hh-news__empty hh-news__empty--side">Yakında.</div>
        ) : (
          news.map((n) => (
            <Link href={`/haberler/${n.slug}`} className="hh-news__row" key={n.slug}>
              <div className="hh-news__meta">{n.dateLabel}</div>
              <div className="hh-news__row-title">{n.title} ▶</div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function PartnersSection({ data }: { data: PartnerMarqueeData }) {
  return (
    <section className="hh-partners">
      <div className="hh-partners__track">
        {[...data.brands, ...data.brands].map((b, i) => (
          <span className="hh-partners__item" key={`${b}-${i}`}>
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}

function ContactCtaSection({ data }: { data: ContactCtaData }) {
  return (
    <section className="hh-cta">
      <div className="hh-cta__left">
        <div className="hh-cta__kicker">{data.kicker}</div>
        <h2 className="hh-cta__head">{data.head}</h2>
        <p className="hh-cta__sub">{data.sub}</p>
        <div className="hh-cta__btns">
          <Link href={data.primaryHref} className="hh-btn hh-btn--solid">
            {data.primaryLabel}
          </Link>
          <a href={data.secondaryHref} className="hh-btn hh-btn--ghost">
            {data.secondaryLabel}
          </a>
        </div>
      </div>
      <div className="hh-cta__contacts">
        {data.contacts.map((c) => (
          <div className="hh-contact" key={c.label}>
            <div className="hh-contact__icon">{c.icon}</div>
            <div className="hh-contact__label">{c.label}</div>
            <div className="hh-contact__value">{c.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
