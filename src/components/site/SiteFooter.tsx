import Image from "next/image";
import Link from "next/link";

import { getFooterPages } from "@/lib/pages/queries";
import { getSettings } from "@/lib/settings";
import "./footer.css";

type FooterCol = { title: string; links: { label: string; href: string }[] };

const COLS: FooterCol[] = [
  {
    title: "Ürünler",
    links: [
      { label: "Fren Sistemleri", href: "/urunler" },
      { label: "Hava Süspansiyon", href: "/urunler" },
      { label: "Aks ve Tekerlek", href: "/urunler" },
      { label: "Şanzıman Parçaları", href: "/urunler" },
      { label: "Elektrik Sistemleri", href: "/urunler" },
      { label: "Kabin & Gövde", href: "/urunler" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "#" },
      { label: "Kalite & Sertifikalar", href: "#" },
      { label: "Sürdürülebilirlik", href: "#" },
      { label: "Fuarlar", href: "#" },
      { label: "Haberler", href: "#" },
      { label: "Kariyer", href: "#" },
    ],
  },
  {
    title: "Destek",
    links: [
      { label: "Teknik Destek", href: "#" },
      { label: "Katalog İndir", href: "/kataloglar" },
      { label: "OEM Çapraz Referans", href: "/urunler" },
      { label: "Garanti Politikası", href: "#" },
      { label: "İadeler", href: "#" },
      { label: "SSS", href: "#" },
    ],
  },
];

const CERTS = ["ISO 9001:2015", "ECE R90", "CE Marked", "TS EN ISO 9001"];
// CMS'te footer sayfası tanımlı değilse gösterilecek statik yedek.
const LEGAL_FALLBACK = ["Künye", "Gizlilik Politikası", "Çerez Ayarları", "Site Haritası"];

export async function SiteFooter() {
  const [footerPages, settings] = await Promise.all([getFooterPages(), getSettings()]);

  const socials = [
    { label: "in", href: settings.linkedinUrl },
    { label: "x", href: settings.xUrl },
    { label: "yt", href: settings.youtubeUrl },
    { label: "ig", href: settings.instagramUrl },
  ].filter((s) => s.href);

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

          {COLS.map((col) => (
            <nav className="sf-col" key={col.title}>
              <div className="sf-col__title">{col.title}</div>
              <div className="sf-col__rule" />
              {col.links.map((l) => (
                <Link key={l.label} href={l.href} className="sf-col__link">
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="sf-certs">
          <span className="sf-certs__label">Sertifikalar</span>
          {CERTS.map((c) => (
            <span key={c} className="sf-cert">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="sf-legal">
        <span className="sf-legal__copy">
          © 2026 MONIVA Otomotiv ve Gıda San. Tic. A.Ş. Tüm hakları saklıdır.
        </span>
        <div className="sf-legal__links">
          {footerPages.length > 0
            ? footerPages.map((p) => (
                <Link key={p.slug} href={`/sayfa/${p.slug}`} className="sf-legal__link">
                  {p.title}
                </Link>
              ))
            : LEGAL_FALLBACK.map((t) => (
                <Link key={t} href="#" className="sf-legal__link">
                  {t}
                </Link>
              ))}
        </div>
      </div>
    </footer>
  );
}
