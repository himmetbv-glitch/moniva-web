import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations();
  return (
    <>
      <header className="mh">
        <div className="logo">
          <span className="logo-text">
            Moniva<small>B2B YEDEK PARÇA</small>
          </span>
        </div>
        <div className="skel" style={{ width: 150, height: 36, borderRadius: 4 }} />
      </header>

      <div className="crumb">
        <div className="skel" style={{ width: 180, height: 12 }} />
      </div>

      <section className="s2-hero">
        <div className="skel" style={{ width: 260, height: 30, marginBottom: 12 }} />
        <div className="skel" style={{ width: "60%", height: 14, marginBottom: 6 }} />
        <div className="skel" style={{ width: "45%", height: 14 }} />
      </section>

      <div className="s2-body" aria-busy="true">
        <div className="s2-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="lrow">
              <div className="skel" style={{ width: 72, height: 72 }} />
              <div className="pinfo">
                <div className="skel" style={{ width: 90, height: 10, marginBottom: 8 }} />
                <div className="skel" style={{ width: "70%", height: 14, marginBottom: 8 }} />
                <div className="skel" style={{ width: "50%", height: 11 }} />
              </div>
              <div className="skel" style={{ width: 110, height: 38 }} />
              <div className="skel" style={{ width: 36, height: 36 }} />
            </div>
          ))}
        </div>

        <aside className="s2-sum">
          <div className="head">
            <h3>{t("quote.cart.loading.summary")}</h3>
            <p>{t("quote.cart.loading.loadingText")}</p>
          </div>
          <div className="stats">
            {[0, 1, 2].map((i) => (
              <div key={i} className="row">
                <div className="skel" style={{ width: 90, height: 12 }} />
                <div className="skel" style={{ width: 54, height: 14 }} />
              </div>
            ))}
          </div>
          <div className="cta-wrap">
            <div className="skel" style={{ width: "100%", height: 50, borderRadius: 4 }} />
          </div>
        </aside>
      </div>
    </>
  );
}
