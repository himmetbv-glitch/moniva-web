"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV_ITEMS } from "./nav-items";
import { LANGS, ACTIVE_LANG } from "./lang-items";

export function HeaderMenu() {
  const pathname = usePathname();
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
        aria-label="Menü"
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
            aria-label="Menüyü kapat"
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
                  {item.label}
                </Link>
              ) : (
                <span key={item.href} className="soon" title="Yakında">
                  {item.label}
                </span>
              ),
            )}

            <div className="sh-menu-lang">
              <span className="sh-menu-lang__hd">DİL</span>
              <div className="sh-menu-lang__opts">
                {LANGS.map((l) =>
                  l.ready ? (
                    <button
                      key={l.code}
                      type="button"
                      className={
                        "sh-menu-lang__opt" +
                        (ACTIVE_LANG === l.code ? " active" : "")
                      }
                    >
                      {l.code}
                    </button>
                  ) : (
                    <span
                      key={l.code}
                      className="sh-menu-lang__opt soon"
                      title="Yakında"
                    >
                      {l.code}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
