import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ContactForm } from "@/components/site/ContactForm";
import { getSettings } from "@/lib/settings";
import { getContactContent, getContactSeo, type ContactSection } from "@/lib/pages/contact-content";
import type {
  ContactHeroData,
  ContactInfoData,
  ContactQuickData,
  ContactLocData,
  ContactDeptsData,
} from "@/lib/pages/contact-sections";
import "./iletisim.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContactSeo();
  return {
    title: seo.seoTitle ?? undefined,
    description: seo.seoDesc ?? undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
  };
}

type Contacts = { phone: string; email: string };

export default async function IletisimPage() {
  const [content, settings] = await Promise.all([getContactContent(), getSettings()]);
  const c: Contacts = { phone: settings.phone, email: settings.email };

  return (
    <>
      <SiteHeader />
      <main className="contact-page">
        {content.sections.map((s) => (
          <ContactSectionRenderer key={s.key} section={s} c={c} />
        ))}
      </main>
      <SiteFooter />
    </>
  );
}

function multiline(text: string) {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

function ContactSectionRenderer({ section, c }: { section: ContactSection; c: Contacts }) {
  switch (section.type) {
    case "CONTACT_HERO":
      return <HeroSection d={section.data as unknown as ContactHeroData} />;
    case "CONTACT_INFO":
      return <InfoSection d={section.data as unknown as ContactInfoData} c={c} />;
    case "CONTACT_QUICK":
      return <QuickSection d={section.data as unknown as ContactQuickData} c={c} />;
    case "CONTACT_LOC":
      return <LocSection d={section.data as unknown as ContactLocData} />;
    case "CONTACT_DEPTS":
      return <DeptsSection d={section.data as unknown as ContactDeptsData} c={c} />;
    default:
      return null;
  }
}

function HeroSection({ d }: { d: ContactHeroData }) {
  return (
    <section className="ct-hero">
      <div className="ct-hero__grid" aria-hidden />
      <div className="ct-hero__inner">
        <nav className="ct-crumb">
          <Link href="/">Ana Sayfa</Link>
          <span>›</span>
          <span className="ct-crumb__cur">{d.crumbLabel}</span>
        </nav>
        <div className="ct-eyebrow">━━ {d.eyebrow}</div>
        <div className="ct-hero__row">
          <div className="ct-hero__lead">
            <h1>{d.title}</h1>
            <p>{d.lead}</p>
          </div>
          <div className="ct-hero__stats">
            {d.stats.map((s) => (
              <div key={s.l} className="ct-hstat">
                <div className="ct-hstat__v">{s.v}</div>
                <div className="ct-hstat__l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ ico, label, lines }: { ico: string; label: string; lines: string[] }) {
  return (
    <div className="ct-info__block">
      <div className="ct-info__ico">{ico}</div>
      <div>
        <div className="ct-info__label">{label}</div>
        {lines.map((l, i) => (
          <div key={i} className={"ct-info__line" + (i === 0 ? " ct-info__line--strong" : "")}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoSection({ d, c }: { d: ContactInfoData; c: Contacts }) {
  return (
    <section className="ct-formsec">
      <ContactForm />
      <aside className="ct-info">
        <div className="ct-eyebrow ct-eyebrow--accent">━━ {d.eyebrow}</div>
        <div className="ct-info__co">{multiline(d.companyName)}</div>
        <InfoBlock ico="◎" label={d.addressLabel} lines={d.addressLines} />
        <InfoBlock ico="✆" label={d.phoneLabel} lines={[c.phone]} />
        <InfoBlock ico="✉" label={d.emailLabel} lines={[c.email]} />
        <InfoBlock ico="◴" label={d.hoursLabel} lines={d.hoursLines} />
        <div className="ct-info__follow">
          <div className="ct-info__label">Bizi takip edin</div>
          <div className="ct-social">
            {["in", "tw", "yt", "ig"].map((s) => (
              <span key={s} className="ct-social__i">
                {s}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}

function QuickSection({ d, c }: { d: ContactQuickData; c: Contacts }) {
  const valueOf = (t: ContactQuickData["tiles"][number]) =>
    t.valueType === "email" ? c.email : t.valueType === "phone" ? c.phone : t.valueCustom;
  return (
    <section className="ct-quick">
      {d.tiles.map((q) => (
        <div key={q.label} className="ct-qtile">
          <div className="ct-qtile__ico">{q.icon}</div>
          <div className="ct-qtile__meta">
            <div className="ct-qtile__label">{q.label}</div>
            <div className="ct-qtile__value">{valueOf(q)}</div>
            <div className="ct-qtile__sub">{q.sub}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

function LocSection({ d }: { d: ContactLocData }) {
  return (
    <section className="ct-loc">
      <div className="ct-loc__head">
        <div className="ct-eyebrow">━━ {d.eyebrow}</div>
        <div className="ct-loc__row">
          <div>
            <h2>{d.title}</h2>
            <p>{d.body}</p>
          </div>
          <div className="ct-loc__btns">
            <a href={d.directionsHref} target="_blank" rel="noreferrer" className="ct-btn ct-btn--primary">
              Yol tarifi al ▶
            </a>
            <a href={d.mapHref} target="_blank" rel="noreferrer" className="ct-btn ct-btn--ghost">
              Haritada aç
            </a>
          </div>
        </div>
      </div>
      <div className="ct-map">
        <iframe src={d.mapSrc} title="Moniva konum haritası" loading="lazy" />
        <div className="ct-mapcard">
          <div className="ct-mapcard__head">
            <span className="ct-mapcard__pin">◎</span>
            <div>
              <div className="ct-mapcard__k">{d.cardTitle}</div>
              <div className="ct-mapcard__v">{d.cardLocation}</div>
            </div>
          </div>
          <div className="ct-mapcard__addr">{multiline(d.cardAddressLines.join("\n"))}</div>
          <div className="ct-mapcard__coords">
            <div>
              <span>Enlem</span>
              <b>{d.coordLat}</b>
            </div>
            <div>
              <span>Boylam</span>
              <b>{d.coordLng}</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeptsSection({ d, c }: { d: ContactDeptsData; c: Contacts }) {
  return (
    <section className="ct-depts">
      <div className="ct-sechead">
        <div className="ct-eyebrow">━━ {d.eyebrow}</div>
        <h2>{d.title}</h2>
      </div>
      <div className="ct-depts__grid">
        {d.depts.map((dept) => (
          <div key={dept.name} className="ct-dept">
            <div className="ct-dept__rule" />
            <div className="ct-dept__name">{dept.name}</div>
            <div className="ct-dept__contact">{dept.contact}</div>
            <div className="ct-dept__rows">
              <div><span>✉</span> {c.email}</div>
              <div><span>✆</span> {c.phone}</div>
              <div className="ct-dept__hours"><span>◴</span> {dept.hours}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
