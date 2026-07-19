"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { NAV_ITEMS } from "./nav-items";

export function SiteNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav className="sh-nav">
      {NAV_ITEMS.map((item) =>
        item.ready ? (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            {t(`nav.${item.key}`)}
          </Link>
        ) : (
          <span key={item.href} className="soon" title={t("common.soon")}>
            {t(`nav.${item.key}`)}
          </span>
        ),
      )}
    </nav>
  );
}
