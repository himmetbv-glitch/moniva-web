import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { getFooterPages } from "@/lib/pages/queries";
import { getSettings } from "@/lib/settings";
import { Link } from "@/i18n/navigation";
import "./footer.css";

// Sütun yapısı: label metinleri messages/*.json'da; href'ler kod tabanında sabit
// (çünkü hepsi aynı rotalara işaret ediyor — kategori dallanma yok).
type ColKey = "products" | "corporate" | "support";
const COLS: readonly { key: ColKey; hrefs: readonly string[] }[] = [
  {
    key: "products",
    hrefs: ["/urunler", "/urunler", "/urunler", "/urunler", "/urunler", "/urunler"],
  },
  {
    key: "corporate",
    hrefs: ["/hakkinda", "/kalite", "/haberler", "/kariyer"],
  },
  {
    key: "support",
    hrefs: ["/iletisim", "/kataloglar", "/urunler"],
  },
];

const CERTS = ["ISO 9001:2015", "EAC"];

export async function SiteFooter() {
  const [footerPages, settings, t] = await Promise.all([
    getFooterPages(),
    getSettings(),
    getTranslations(),
  ]);

  const socials = [
    { label: "in", href: settings.linkedinUrl },
    { label: "x", href: settings.xUrl },
    { label: "yt", href: settings.youtubeUrl },
    { label: "ig", href: settings.instagramUrl },
  ].filter((s) => s.href);

  const legalFallback = t.raw("footer.legal.fallback") as string[];

  return (
    <footer className="site-footer">
      <div className="sf-main">
        <div className="sf-grid">
          <div className="sf-brand">
            <Link href="/" className="sf-logo">
              <Image
                src="/brand/moniva-logo.png"
                alt="Moniva"
                width={132}
                height={40}
              />
            </Link>
            <address className="sf-address">
              {settings.companyName}
              <br />
              {settings.addressLine}
              <br />
              {settings.phone}
              <br />
              {settings.email}
            </address>
            <div className="sf-social">
              {socials.length > 0
                ? socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-social__item"
                    >
                      {s.label}
                    </a>
                  ))
                : ["in", "x", "yt"].map((s) => (
                    <span key={s} className="sf-social__item">
                      {s}
                    </span>
                  ))}
            </div>
          </div>

          {COLS.map((col) => {
            const items = t.raw(`footer.columns.${col.key}.items`) as string[];
            return (
              <nav className="sf-col" key={col.key}>
                <div className="sf-col__title">
                  {t(`footer.columns.${col.key}.title`)}
                </div>
                <div className="sf-col__rule" />
                {items.map((label, i) => (
                  <Link
                    key={label}
                    href={col.hrefs[i] ?? "#"}
                    className="sf-col__link"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            );
          })}
        </div>

        <div className="sf-certs">
          <span className="sf-certs__label">{t("footer.certsLabel")}</span>
          {CERTS.map((c) => (
            <span key={c} className="sf-cert">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="sf-legal">
        <span className="sf-legal__copy">{t("footer.legal.copy")}</span>
        <div className="sf-legal__links">
          {footerPages.length > 0
            ? footerPages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/sayfa/${p.slug}`}
                  className="sf-legal__link"
                >
                  {p.title}
                </Link>
              ))
            : legalFallback.map((label) => (
                <Link key={label} href="#" className="sf-legal__link">
                  {label}
                </Link>
              ))}
        </div>
      </div>
    </footer>
  );
}
