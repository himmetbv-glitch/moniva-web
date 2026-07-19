import { getTranslations } from "next-intl/server";

import { getCart } from "@/lib/actions/quote";
import { getQuotePrefill } from "@/lib/customer/quotes";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@/i18n/navigation";
import { QuoteCart } from "./QuoteCart";
import { CartIcon, ClockIcon, ShieldIcon } from "./icons";

export const dynamic = "force-dynamic";

export default async function QuoteListPage() {
  const [cart, prefill, t] = await Promise.all([
    getCart(),
    getQuotePrefill(),
    getTranslations(),
  ]);

  return (
    <>
      <SiteHeader />

      <div className="crumb">
        <Link href="/">{t("crumb.home")}</Link>
        <span className="sep">›</span>
        <b>{t("quote.cart.crumb")}</b>
      </div>

      {cart.exists ? (
        <>
          <section className="s2-hero">
            <h1>
              {t("quote.cart.hero.title")}{" "}
              <small>{t("quote.cart.hero.subLabel")}</small>
            </h1>
            <p>
              {t.rich("quote.cart.hero.sub", {
                b: (chunks) => (
                  <b style={{ color: "var(--primary)" }}>{chunks}</b>
                ),
              })}
            </p>
            <div className="badges">
              <div className="b">
                <ShieldIcon /> {t("quote.cart.hero.badgePrice")}
              </div>
              <div className="b">
                <ClockIcon /> {t("quote.cart.hero.badgeTime")}
              </div>
            </div>
          </section>

          <QuoteCart cart={cart} prefill={prefill} />
        </>
      ) : (
        <div className="empty">
          <CartIcon className="" />
          <h2>{t("quote.cart.empty.title")}</h2>
          <p>{t("quote.cart.empty.body")}</p>
          <Link className="btn-quote" href="/urunler">
            {t("quote.cart.empty.cta")}
          </Link>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
