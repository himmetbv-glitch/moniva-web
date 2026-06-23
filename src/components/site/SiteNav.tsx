"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="sh-nav">
      {NAV_ITEMS.map((item) =>
        item.ready ? (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            {item.label}
          </Link>
        ) : (
          <span key={item.href} className="soon" title="Yakında">
            {item.label}
          </span>
        ),
      )}
    </nav>
  );
}
