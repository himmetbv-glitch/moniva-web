"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { NAV_ITEMS } from "./nav-items";
import { LANGS, type LangCode } from "./lang-items";

export function HeaderMenu() {
  const pathname = usePathname();
  const locale = useLocale() as LangCode;
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  // Rota değişince menüyü kapat.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={"sh-menu" + (open ? " sh-menu--open" : "")}>
      <button
        type="button"
        className="sh-menu-btn"
        aria-label={t("header.menu.open")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="sh-menu-overlay"
            aria-label={t("header.menu.close")}
            onClick={() => setOpen(false)}
          />
          <div className="sh-menu-panel">
            {NAV_ITEMS.map((item) =>
              item.ready ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? "active" : ""}
                  onClick={() => setOpen(false)}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ) : (
                <span key={item.href} className="soon" title={t("common.soon")}>
                  {t(`nav.${item.key}`)}
                </span>
              ),
            )}

            <div className="sh-menu-lang">
              <span className="sh-menu-lang__hd">{t("header.menu.langHeading")}</span>
              <div className="sh-menu-lang__opts">
                {LANGS.map((l) => (
                  <Link
                    key={l.code}
                    href={pathname}
                    locale={l.code}
                    className={
                      "sh-menu-lang__opt" +
                      (locale === l.code ? " active" : "")
                    }
                  >
                    {l.code.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
