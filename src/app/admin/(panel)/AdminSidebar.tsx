"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, type ReactNode } from "react";

import { logoutAction } from "@/lib/actions/auth";
import type { SidebarCounts } from "@/lib/admin/dashboard";
import { Icons } from "./icons";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  ready: boolean;
  count?: number;
  badge?: boolean;
};

export function AdminSidebar({
  name,
  initials,
  counts,
}: {
  name: string;
  initials: string;
  counts: SidebarCounts;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Genel Bakış",
      items: [
        { label: "Panel", href: "/admin/dashboard", icon: <Icons.dash />, ready: true },
      ],
    },
    {
      label: "Katalog",
      items: [
        { label: "Ürünler", href: "/admin/products", icon: <Icons.prod />, ready: true, count: counts.products },
        { label: "Kategoriler", href: "/admin/categories", icon: <Icons.cat />, ready: true, count: counts.categories },
        { label: "Markalar", href: "/admin/brands", icon: <Icons.brand />, ready: true },
      ],
    },
    {
      label: "Satış",
      items: [
        { label: "Hızlı Teklif", href: "/admin/quotes/new", icon: <Icons.quoteNew />, ready: true },
        { label: "Teklif Talepleri", href: "/admin/inquiries", icon: <Icons.order />, ready: true, count: counts.newQuotes, badge: counts.newQuotes > 0 },
        { label: "Takip Gerekenler", href: "/admin/follow-ups", icon: <Icons.bell />, ready: true, count: counts.followUps, badge: counts.followUps > 0 },
        { label: "Mesajlar", href: "/admin/messages", icon: <Icons.msg />, ready: true, count: counts.newMessages, badge: counts.newMessages > 0 },
        { label: "Aylık Özet", href: "/admin/reports", icon: <Icons.report />, ready: true },
      ],
    },
    {
      label: "İçerik",
      items: [
        { label: "Sayfalar", href: "/admin/pages", icon: <Icons.page />, ready: true },
        { label: "Newsroom", href: "/admin/news", icon: <Icons.news />, ready: true },
        { label: "Kataloglar", href: "/admin/catalogues", icon: <Icons.cata />, ready: true },
      ],
    },
    {
      label: "Sistem",
      items: [
        { label: "Kullanıcılar & Roller", href: "/admin/admins", icon: <Icons.user />, ready: true },
        { label: "Ayarlar", href: "/admin/settings", icon: <Icons.set />, ready: true },
      ],
    },
  ];

  return (
    <aside className="mv-sidebar">
      <div className="mv-sidebar__brand">
        <Image
          src="/brand/moniva-logo.png"
          alt="Moniva"
          width={104}
          height={32}
          className="mv-sidebar__logo"
        />
        <div className="mv-sidebar__brandmeta">
          <span className="mv-sidebar__brandtop">YÖNETİM</span>
          <span className="mv-sidebar__brandsub">BACKEND v3.2</span>
        </div>
      </div>

      <nav className="mv-sidebar__nav">
        {groups.map((g) => (
          <div className="mv-sidebar__group" key={g.label}>
            <div className="mv-sidebar__grouplabel">{g.label}</div>
            {g.items.map((it) => {
              const active = pathname === it.href;
              const inner = (
                <>
                  <span className="mv-nav__icon">{it.icon}</span>
                  <span className="mv-nav__label">{it.label}</span>
                  {it.count !== undefined && (
                    <span
                      className={
                        "mv-nav__count" + (it.badge ? " mv-nav__count--badge" : "")
                      }
                    >
                      {it.count}
                    </span>
                  )}
                </>
              );
              if (it.ready) {
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={"mv-nav" + (active ? " mv-nav--active" : "")}
                    aria-current={active ? "page" : undefined}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <span
                  key={it.href}
                  className="mv-nav mv-nav--soon"
                  title="Yakında"
                  aria-disabled="true"
                >
                  {inner}
                </span>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mv-sidebar__user">
        <div className="mv-usercard">
          <div className="mv-usercard__avatar">{initials}</div>
          <div className="mv-usercard__meta">
            <span className="mv-usercard__name">{name}</span>
            <span className="mv-usercard__role">Süper Yönetici</span>
          </div>
          <button
            type="button"
            className="mv-usercard__logout"
            title="Çıkış yap"
            disabled={pending}
            onClick={() => startTransition(() => logoutAction())}
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path d="M7 16H3.5V2H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M11 12.5L14.5 9L11 5.5M14.5 9H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
