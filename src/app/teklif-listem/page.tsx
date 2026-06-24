import Link from "next/link";

import { getCart } from "@/lib/actions/quote";
import { getQuotePrefill } from "@/lib/customer/quotes";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QuoteCart } from "./QuoteCart";
import { CartIcon, ClockIcon, ShieldIcon } from "./icons";

export const dynamic = "force-dynamic";

export default async function QuoteListPage() {
  const [cart, prefill] = await Promise.all([getCart(), getQuotePrefill()]);

  return (
    <>
      <SiteHeader />

      <div className="crumb">
        <Link href="/">Ana Sayfa</Link>
        <span className="sep">›</span>
        <b>Teklif Listem</b>
      </div>

      {cart.exists ? (
        <>
          <section className="s2-hero">
            <h1>
              Teklif Listem <small>· My Quote List</small>
            </h1>
            <p>
              Aşağıdaki ürünler için size özel{" "}
              <b style={{ color: "var(--primary)" }}>fiyat teklifi</b>{" "}
              hazırlanacaktır. Listeyi inceleyin, adetleri ayarlayın ve{" "}
              <b style={{ color: "var(--primary)" }}>&quot;Teklif Al&quot;</b> ile
              gönderin — uzman ekibimiz 24 saat içinde size dönüş yapacaktır.
            </p>
            <div className="badges">
              <div className="b">
                <ShieldIcon /> Kişiye özel fiyat
              </div>
              <div className="b">
                <ClockIcon /> 24 saat içinde dönüş
              </div>
            </div>
          </section>

          <QuoteCart cart={cart} prefill={prefill} />
        </>
      ) : (
        <div className="empty">
          <CartIcon className="" />
          <h2>Teklif listeniz boş</h2>
          <p>
            Ürünleri inceleyip teklif listenize ekleyin; ardından tek talepte
            size özel fiyat alın.
          </p>
          <Link className="btn-quote" href="/urunler">
            Ürünlere Göz At
          </Link>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
