import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  getQualityContent,
  getQualitySeo,
  type QualitySection,
} from "@/lib/pages/quality-content";
import type {
  QualityBannerData,
  QualityMissionData,
  QualityStandardsData,
  QualityDocsData,
} from "@/lib/pages/quality-sections";
import "./kalite.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getQualitySeo();
  return {
    title: seo.seoTitle ?? undefined,
    description: seo.seoDesc ?? undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
  };
}

export default async function KalitePage() {
  const content = await getQualityContent();
  return (
    <>
      <SiteHeader />
      <main className="quality-page">
        {content.sections.map((s) => (
          <QualitySectionRenderer key={s.key} section={s} />
        ))}
      </main>
      <SiteFooter />
    </>
  );
}

function QualitySectionRenderer({ section }: { section: QualitySection }) {
  switch (section.type) {
    case "QUALITY_BANNER":
      return <BannerSection d={section.data as unknown as QualityBannerData} />;
    case "QUALITY_MISSION":
      return <MissionSection d={section.data as unknown as QualityMissionData} />;
    case "QUALITY_STANDARDS":
      return <StandardsSection d={section.data as unknown as QualityStandardsData} />;
    case "QUALITY_DOCS":
      return <DocsSection d={section.data as unknown as QualityDocsData} />;
    default:
      return null;
  }
}

function BannerSection({ d }: { d: QualityBannerData }) {
  return (
    <section className="ql-banner">
      <div className="ql-banner__grid" aria-hidden />
      <div className="ql-banner__inner">
        <nav className="ql-crumb">
          <Link href="/">Ana Sayfa</Link>
          <span>›</span>
          <span className="ql-crumb__cur">{d.crumbLabel}</span>
        </nav>
        <div className="ql-banner__row">
          <div>
            <div className="ql-eyebrow ql-eyebrow--accent">━━ {d.eyebrow}</div>
            <h1 className="ql-banner__title">{d.title}</h1>
            <p className="ql-banner__sub">{d.sub}</p>
          </div>
          <div className="ql-banner__stats">
            {d.stats.map((s) => (
              <div key={s.l} className="ql-bstat">
                <div className="ql-bstat__v">{s.v}</div>
                <div className="ql-bstat__l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionSection({ d }: { d: QualityMissionData }) {
  return (
    <section className="ql-mission">
      <div className="ql-mission__text">
        <div className="ql-h">
          <div className="ql-h__title">{d.title}</div>
          <div className="ql-h__rule" style={{ width: d.ruleWidth }} />
        </div>
        <p className="ql-lead">{d.lead}</p>
        <p className="ql-body">{d.body}</p>
      </div>
      <div className="ql-mission__media">
        <Image
          src={d.image}
          alt="Moniva kalite laboratuvarı"
          fill
          sizes="(max-width: 900px) 100vw, 45vw"
          style={{ objectFit: "cover" }}
        />
      </div>
    </section>
  );
}

function StandardsSection({ d }: { d: QualityStandardsData }) {
  return (
    <section className="ql-certs">
      <div className="ql-h">
        <div className="ql-h__title">{d.title}</div>
        <div className="ql-h__rule" style={{ width: d.ruleWidth }} />
        <p className="ql-h__sub">{d.sub}</p>
      </div>
      <div className="ql-certs__grid">
        {d.standards.map((s) => (
          <div key={s.code} className="ql-cert">
            <svg className="ql-seal" viewBox="0 0 64 64" width="64" height="64" aria-hidden>
              <circle cx="32" cy="32" r="28" stroke="var(--primary)" strokeWidth="1.5" fill="var(--tint)" />
              <circle cx="32" cy="32" r="20" stroke="var(--primary)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
              <path d="M22 32 L29 39 L43 25" stroke="var(--primary)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="ql-cert__body">
              <div className="ql-cert__top">
                <span className="ql-cert__code">{s.code}</span>
                <span className="ql-cert__year">{s.year}</span>
              </div>
              <div className="ql-cert__org">{s.org}</div>
              <div className="ql-cert__scope">{s.scope}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DocsSection({ d }: { d: QualityDocsData }) {
  return (
    <section className="ql-docs">
      <div className="ql-docs__head">
        <div className="ql-h">
          <div className="ql-h__title">{d.title}</div>
          <div className="ql-h__rule" style={{ width: d.ruleWidth }} />
          <p className="ql-h__sub">{d.sub}</p>
        </div>
      </div>
      <div className="ql-docs__grid">
        {d.docs.map((doc) => {
          const isPdf = doc.type === "pdf";
          const ready = Boolean(doc.fileUrl);
          return (
            <div key={doc.name} className="ql-doc">
              <div className="ql-doc__top">
                <div className={"ql-doc__icon" + (isPdf ? " ql-doc__icon--pdf" : "")}>
                  <span className="ql-doc__fold" />
                  {isPdf ? "PDF" : "IMG"}
                </div>
                <div className="ql-doc__meta">
                  <div className="ql-doc__flag">{doc.flag}</div>
                  <div className="ql-doc__name">{doc.name}</div>
                  <div className="ql-doc__lang">{doc.lang}</div>
                </div>
              </div>
              <div className="ql-doc__foot">
                <span className="ql-doc__size">
                  {doc.type.toUpperCase()} · {doc.size}
                </span>
                {ready ? (
                  <a
                    className="ql-doc__dl"
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                  >
                    İndir ↓
                  </a>
                ) : (
                  <span className="ql-doc__soon" title="Yakında">
                    Yakında
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
