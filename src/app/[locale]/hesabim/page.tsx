import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/customer/dal";
import { getMyQuotes } from "@/lib/customer/quotes";
import { MY_QUOTE_KEY, MY_QUOTE_KIND } from "@/lib/customer/quote-status";
import { LogoutButton } from "./LogoutButton";

export default async function AccountHomePage() {
  const user = await requireUser("/hesabim");
  const [quotes, t] = await Promise.all([
    getMyQuotes(user.id),
    getTranslations(),
  ]);

  const firstName =
    (user.name ?? "").trim().split(/\s+/)[0] || t("account.dashboard.greetingFallback");

  return (
    <div className="ac-inner">
      <div className="ac-head">
        <div>
          <h1 className="ac-title">
            {t("account.dashboard.greeting", { name: firstName })}
          </h1>
          <p className="ac-sub">{t("account.dashboard.sub")}</p>
        </div>
        <div className="ac-head__right">
          {user.isVerified ? (
            <span className="ac-badge ac-badge--ok">
              {t("account.dashboard.verifiedBadge")}
            </span>
          ) : (
            <span className="ac-badge ac-badge--wait">
              {t("account.dashboard.pendingBadge")}
            </span>
          )}
          <Link href="/hesabim/profil" className="ac-logout">
            {t("account.dashboard.profileLink")}
          </Link>
          <LogoutButton />
        </div>
      </div>

      {!user.isVerified && (
        <div className="ac-note">{t("account.dashboard.pendingNote")}</div>
      )}

      <div className="ac-section">
        <div className="ac-section__head">
          <h2 className="ac-section__title">
            {t("account.dashboard.quotesTitle")}
          </h2>
          <Link href="/urunler" className="ac-link">
            {t("account.dashboard.newQuoteLink")}
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="ac-empty">
            <p>{t("account.dashboard.emptyText")}</p>
            <Link href="/urunler" className="ac-btn">
              {t("account.dashboard.emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="ac-card">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>{t("account.dashboard.table.ref")}</th>
                  <th>{t("account.dashboard.table.date")}</th>
                  <th className="ac-num">{t("account.dashboard.table.lines")}</th>
                  <th>{t("account.dashboard.table.status")}</th>
                  <th className="ac-num">{t("account.dashboard.table.amount")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const kind = MY_QUOTE_KIND[q.status];
                  const statusKey = MY_QUOTE_KEY[q.status];
                  return (
                    <tr key={q.id}>
                      <td>
                        <Link
                          href={`/hesabim/teklifler/${q.id}`}
                          className="ac-ref"
                        >
                          {q.ref}
                        </Link>
                      </td>
                      <td className="ac-dim">{q.createdAtLabel}</td>
                      <td className="ac-num ac-dim">{q.itemCount}</td>
                      <td>
                        <span className={`ac-pill ac-pill--${kind}`}>
                          {t(`quote.status.${statusKey}`)}
                        </span>
                      </td>
                      <td className="ac-num">{q.totalLabel ?? "—"}</td>
                      <td>
                        <Link
                          href={`/hesabim/teklifler/${q.id}`}
                          className="ac-open"
                        >
                          {t("account.dashboard.table.open")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
