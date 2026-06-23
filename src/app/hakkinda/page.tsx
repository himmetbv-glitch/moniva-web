import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getAboutContent, getAboutSeo, type AboutSection } from "@/lib/pages/about-content";
import type {
  AboutHeroData,
  AboutFacilityData,
  AboutMvData,
  AboutTimelineData,
  AboutCertsData,
  AboutCtaData,
} from "@/lib/pages/about-sections";
import "./hakkinda.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getAboutSeo();
  return {
    title: seo.seoTitle ?? undefined,
    description: seo.seoDesc ?? undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
  };
}

export default async function HakkindaPage() {
  const content = await getAboutContent();
  return (
    <>
      <SiteHeader />
      <main className="about-page">
        {content.sections.map((s) => (
          <AboutSectionRenderer key={s.key} section={s} />
        ))}
      </main>
      <SiteFooter />
    </>
  );
}

function AboutSectionRenderer({ section }: { section: AboutSection }) {
  switch (section.type) {
    case "ABOUT_HERO":
      return <HeroSection d={section.data as unknown as AboutHeroData} />;
    case "ABOUT_FACILITY":
      return <FacilitySection d={section.data as unknown as AboutFacilityData} />;
    case "ABOUT_MV":
      return <MvSection d={section.data as unknown as AboutMvData} />;
    case "ABOUT_TIMELINE":
      return <TimelineSection d={section.data as unknown as AboutTimelineData} />;
    case "ABOUT_CERTS":
      return <CertsSection d={section.data as unknown as AboutCertsData} />;
    case "ABOUT_CTA":
      return <CtaSection d={section.data as unknown as AboutCtaData} />;
    default:
      return null;
  }
}

function HeroSection({ d }: { d: AboutHeroData }) {
  return (
    <nav className="ab-crumb">
      <Link href="/">Ana Sayfa</Link>
      <span>/</span>
      <span className="ab-crumb__cur">{d.crumbLabel}</span>
    </nav>
  );
}

function FacilitySection({ d }: { d: AboutFacilityData }) {
  return (
    <section className="ab-facility">
      <div className="ab-facility__media">
        <Image
          src={d.image}
          alt="Moniva Konya tesisi"
          fill
          sizes="(max-width: 900px) 100vw, 55vw"
          style={{ objectFit: "cover" }}
        />
        <div className="ab-facility__caption">
          <span className="ab-facility__dot" />
          {d.caption}
        </div>
      </div>
      <div className="ab-facility__text">
        <div className="ab-eyebrow">━━ {d.eyebrow}</div>
        <h2>{d.title}</h2>
        <p>{d.body}</p>
        <div className="ab-facility__stats">
          {d.stats.map((s) => (
            <div key={s.l}>
              <div className="ab-facility__statv">{s.v}</div>
              <div className="ab-facility__statl">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MvSection({ d }: { d: AboutMvData }) {
  return (
    <section className="ab-mv">
      {d.columns.map((b) => (
        <div key={b.tag} className="ab-mv__col">
          <div className="ab-eyebrow">━━ {b.tag}</div>
          <h3>{b.title}</h3>
          <p>{b.body}</p>
        </div>
      ))}
    </section>
  );
}

function TimelineSection({ d }: { d: AboutTimelineData }) {
  return (
    <section className="ab-timeline">
      <div className="ab-sechead">
        <div className="ab-eyebrow">━━ {d.eyebrow}</div>
        <h2>{d.title}</h2>
      </div>
      <div className="ab-timeline__track">
        <div className="ab-timeline__spine" aria-hidden />
        {d.entries.map((e) => (
          <div key={e.year} className="ab-tl">
            <span className="ab-tl__dot" />
            <div className="ab-tl__year">{e.year}</div>
            <div className="ab-tl__title">{e.title}</div>
            <div className="ab-tl__body">{e.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CertsSection({ d }: { d: AboutCertsData }) {
  return (
    <section className="ab-certs">
      <div className="ab-sechead">
        <div className="ab-eyebrow">━━ {d.eyebrow}</div>
        <h2>{d.title}</h2>
      </div>
      <div className="ab-certs__grid">
        {d.certs.map((c) => (
          <div key={c.code} className="ab-cert">
            <div className="ab-cert__head">
              <span className="ab-cert__check">✓</span>
              <span className="ab-cert__code">{c.code}</span>
            </div>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ d }: { d: AboutCtaData }) {
  return (
    <section className="ab-cta">
      <div className="ab-cta__lead">
        <div className="ab-eyebrow ab-eyebrow--accent">━━ {d.eyebrow}</div>
        <h2>{d.title}</h2>
        <p>{d.body}</p>
        <div className="ab-cta__btns">
          <Link href={d.primaryHref} className="ab-btn ab-btn--primary">
            {d.primaryLabel}
          </Link>
          <a href={d.secondaryHref} className="ab-btn ab-btn--ghost">
            {d.secondaryLabel}
          </a>
        </div>
      </div>
      <div className="ab-cta__contacts">
        {d.contacts.map((c) => (
          <div key={c.label} className="ab-cta__contact">
            <div className="ab-cta__icon">{c.icon}</div>
            <div className="ab-cta__clabel">{c.label}</div>
            <div className="ab-cta__cvalue">{c.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
