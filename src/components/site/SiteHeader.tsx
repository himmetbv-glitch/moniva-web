import Image from "next/image";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import "./header.css";
import { getCart } from "@/lib/actions/quote";
import { getOptionalUser } from "@/lib/customer/dal";
import { Link } from "@/i18n/navigation";
import { SiteNav } from "./SiteNav";
import { SiteSearch } from "./SiteSearch";
import { LangSwitcher } from "./LangSwitcher";
import { HeaderMenu } from "./HeaderMenu";

export async function SiteHeader() {
  const [cart, user, t] = await Promise.all([
    getCart(),
    getOptionalUser(),
    getTranslations(),
  ]);
  const isAdmin = user?.role === "ADMIN";
  const accountLabel = isAdmin
    ? t("header.account.admin")
    : user
    ? t("header.account.member")
    : t("header.account.guest");

  const accountInner = (
    <>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
      </svg>
      <span className="label">{accountLabel}</span>
    </>
  );

  return (
    <header className="site-header">
      <div className="sh-top">
        <Link className="sh-logo" href="/">
          <Image
            src="/brand/moniva-logo.png"
            alt="Moniva"
            width={1000}
            height={178}
            className="sh-logo-img"
            priority
          />
        </Link>

        <div className="sh-right">
          <SiteSearch />

          <div className="sh-div" />

          <Link className="sh-cart" href="/teklif-listem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h2l3 12h10l3-8H6" />
              <circle cx="9" cy="20" r="1.4" fill="currentColor" />
              <circle cx="18" cy="20" r="1.4" fill="currentColor" />
            </svg>
            <span className="label">{t("header.cart")}</span>
            <span className="sh-count">{cart.totalQuantity}</span>
          </Link>

          <div className="sh-div" />

          {isAdmin ? (
            // Admin paneli locale-agnostic (/admin, [locale] altında değil) →
            // i18n Link locale eklemesin diye düz next/link kullan.
            <NextLink className="sh-account" href="/admin/dashboard">
              {accountInner}
            </NextLink>
          ) : (
            <Link className="sh-account" href={user ? "/hesabim" : "/giris"}>
              {accountInner}
            </Link>
          )}

          <div className="sh-div" />

          <LangSwitcher />

          <HeaderMenu />
        </div>
      </div>

      <SiteNav />
    </header>
  );
}
