import Image from "next/image";
import Link from "next/link";

import "./header.css";
import { getCart } from "@/lib/actions/quote";
import { getOptionalUser } from "@/lib/customer/dal";
import { SiteNav } from "./SiteNav";
import { SiteSearch } from "./SiteSearch";
import { LangSwitcher } from "./LangSwitcher";
import { HeaderMenu } from "./HeaderMenu";

export async function SiteHeader() {
  const [cart, user] = await Promise.all([getCart(), getOptionalUser()]);
  const isAdmin = user?.role === "ADMIN";
  const accountHref = isAdmin ? "/admin/dashboard" : "/hesabim";
  const accountLabel = isAdmin ? "Yönetim" : user ? "Hesabım" : "Giriş";

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
            <span className="label">Teklif Listem</span>
            <span className="sh-count">{cart.totalQuantity}</span>
          </Link>

          <div className="sh-div" />

          <Link className="sh-account" href={user ? accountHref : "/giris"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.4" />
              <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
            </svg>
            <span className="label">{accountLabel}</span>
          </Link>

          <div className="sh-div" />

          <LangSwitcher />

          <HeaderMenu />
        </div>
      </div>

      <SiteNav />
    </header>
  );
}
