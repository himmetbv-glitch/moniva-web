import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CareersForm } from "@/components/site/CareersForm";
import { Link } from "@/i18n/navigation";
import { toDbLocale } from "@/lib/i18n-runtime";
import { getCareersContent, getCareersSeo } from "@/lib/pages/careers-content";
import type { CareersInfoData } from "@/lib/pages/careers-sections";
import { getSettings } from "@/lib/settings";
import "./kariyer.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getCareersSeo();
  return {
    title: seo.seoTitle ?? undefined,
    description: seo.seoDesc ?? undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
  };
}

export default async function KariyerPage() {
  const locale = toDbLocale(await getLocale());
  const [content, settings, t] = await Promise.all([
    getCareersContent(locale),
    getSettings(),
    getTranslations(),
  ]);
  const info = content.sections.find((s) => s.type === "CAREERS_INFO")?.data as
    | CareersInfoData
    | undefined;

  return (
    <>
      <SiteHeader />
      <main className="careers-page">
        <nav className="cr-crumb">
          <Link href="/">{t("crumb.home")}</Link>
          <span>/</span>
          <span className="cr-crumb__cur">
            {info?.crumbLabel ?? t("crumb.careers")}
          </span>
        </nav>

        <section className="cr-apply">
          {info && <CareersInfo d={info} teamAlt={t("careers.teamAlt")} />}
          <CareersForm positions={settings.careerPositions} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function CareersInfo({ d, teamAlt }: { d: CareersInfoData; teamAlt: string }) {
  return (
    <aside className="cr-info">
      <div className="cr-info__media">
        <Image
          src={d.image}
          alt={teamAlt}
          fill
          sizes="(max-width: 920px) 100vw, 440px"
          style={{ objectFit: "cover" }}
        />
      </div>
      <h1 className="cr-info__title">
        <span className="cr-accent">{d.titleAccent}</span>
        {d.titleRest}
      </h1>
      <div className="cr-info__rule" />
      <p className="cr-info__lead">{d.lead}</p>

      <div className="cr-stats">
        {d.stats.map((s) => (
          <div className="cr-stat" key={s.l}>
            <div className="cr-stat__v">{s.v}</div>
            <div className="cr-stat__l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="cr-email">
        <div className="cr-email__k">{d.emailLabel}</div>
        <div className="cr-email__v">
          {d.emailPre}
          <br />
          <b>{d.emailAddr}</b> {d.emailPost}
        </div>
      </div>
    </aside>
  );
}
