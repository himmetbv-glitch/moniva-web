import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/customer/dal";
import { getMyQuoteDetail } from "@/lib/customer/quotes";
import { MY_QUOTE_KEY, MY_QUOTE_KIND } from "@/lib/customer/quote-status";
import { MyQuoteDecisions } from "./MyQuoteDecisions";

export default async function MyQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/hesabim/teklifler/${id}`);
  const q = await getMyQuoteDetail(user.id, id);
  if (!q) notFound();

  const t = await getTranslations();
  const kind = MY_QUOTE_KIND[q.status];
  const statusKey = MY_QUOTE_KEY[q.status];
  const statusLabel = t(`quote.status.${statusKey}`);

  // Karar verilmiş tekliflerde müşteriye kısa açıklama.
  const DECIDED_HINT_KEYS: Partial<Record<string, string>> = {
    APPROVED: "approved",
    REVISION_REQUESTED: "revisionRequested",
    DECLINED: "declined",
    CLOSED: "closed",
  };
  const hintKey = DECIDED_HINT_KEYS[q.status];

  return (
    <div className="ac-inner">
      <div className="ac-crumb">
        <Link href="/hesabim">{t("account.quoteDetail.crumbBack")}</Link>{" "}
        <span>/</span> {t("account.quoteDetail.crumbTitle", { ref: q.ref })}
      </div>

      <div className="ac-head">
        <div>
          <h1 className="ac-title">
            {t("account.quoteDetail.title", { ref: q.ref })}
          </h1>
          <p className="ac-sub">
            {t("account.quoteDetail.createdInfo", {
              date: q.createdAtLabel,
              qty: q.totalQty,
            })}
          </p>
        </div>
        <span className={`ac-pill ac-pill--${kind}`}>{statusLabel}</span>
      </div>

      {!q.priced && (
        <div className="ac-note">{t("account.quoteDetail.pendingNote")}</div>
      )}

      <div className="ac-section">
        <h2 className="ac-section__title">
          {t("account.quoteDetail.sections.items")}
        </h2>
        <div className="ac-card">
          <table className="ac-table">
            <thead>
              <tr>
                <th>{t("account.quoteDetail.items.part")}</th>
                <th className="ac-num">{t("account.quoteDetail.items.qty")}</th>
                {q.priced && (
                  <th className="ac-num">{t("account.quoteDetail.items.unit")}</th>
                )}
                {q.priced && (
                  <th className="ac-num">
                    {t("account.quoteDetail.items.amount")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {q.items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div className="ac-pname">{it.name}</div>
                    <div className="ac-mono ac-dim">{it.sku}</div>
                  </td>
                  <td className="ac-num">{it.quantity}</td>
                  {q.priced && (
                    <td className="ac-num">{it.unitPriceLabel ?? "—"}</td>
                  )}
                  {q.priced && (
                    <td className="ac-num">{it.lineTotalLabel ?? "—"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {q.priced && (
        <div className="ac-grid2">
          <div className="ac-section">
            <h2 className="ac-section__title">
              {t("account.quoteDetail.sections.summary")}
            </h2>
            <div className="ac-card ac-pad">
              <div className="ac-trow">
                <span>{t("account.quoteDetail.summary.subtotal")}</span>
                <b>{q.totalsLabels.subtotal}</b>
              </div>
              {q.discountPct > 0 && (
                <div className="ac-trow ac-trow--minus">
                  <span>
                    {t("account.quoteDetail.summary.discount", { pct: q.discountPct })}
                  </span>
                  <b>− {q.totalsLabels.discount}</b>
                </div>
              )}
              <div className="ac-trow">
                <span>
                  {t("account.quoteDetail.summary.shipping")}
                  {q.shippingMode ? ` · ${q.shippingMode}` : ""}
                </span>
                <b>{q.totalsLabels.shipping}</b>
              </div>
              <div className="ac-trow">
                <span>
                  {t("account.quoteDetail.summary.vat", { pct: q.vatRate })}
                </span>
                <b>{q.totalsLabels.vat}</b>
              </div>
              <div className="ac-trow ac-trow--total">
                <span>{t("account.quoteDetail.summary.total")}</span>
                <b>{q.totalsLabels.total}</b>
              </div>
              <a
                href={`/hesabim/teklifler/${q.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="ac-btn ac-btn--block"
              >
                {t("account.quoteDetail.summary.pdfDownload")}
              </a>
            </div>
          </div>

          <div className="ac-section">
            <h2 className="ac-section__title">
              {t("account.quoteDetail.sections.terms")}
            </h2>
            <div className="ac-card ac-pad">
              <div className="ac-row">
                <span className="ac-row__k">
                  {t("account.quoteDetail.terms.currency")}
                </span>
                <span>{q.currency}</span>
              </div>
              <div className="ac-row">
                <span className="ac-row__k">
                  {t("account.quoteDetail.terms.validity")}
                </span>
                <span>{q.validUntilLabel ?? "—"}</span>
              </div>
              <div className="ac-row">
                <span className="ac-row__k">
                  {t("account.quoteDetail.terms.payment")}
                </span>
                <span>{q.paymentTerms ?? "—"}</span>
              </div>
              <div className="ac-row">
                <span className="ac-row__k">
                  {t("account.quoteDetail.terms.quoteDate")}
                </span>
                <span>{q.quotedAtLabel ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {q.canDecide ? (
        <div className="ac-section">
          <MyQuoteDecisions quoteRequestId={q.id} />
        </div>
      ) : q.isExpired && q.priced ? (
        <div className="ac-note ac-note--warn">
          {t("account.quoteDetail.expiredNote")}
        </div>
      ) : q.priced ? (
        <div className={`ac-decided ac-decided--${kind}`}>
          <b>{statusLabel}.</b>
          {hintKey ? ` ${t(`account.quoteDetail.decidedHint.${hintKey}`)}` : ""}
        </div>
      ) : null}

      <div className="ac-section">
        <h2 className="ac-section__title">
          {t("account.quoteDetail.sections.shipping")}
        </h2>
        <div className="ac-card ac-pad">
          <div className="ac-ship">
            <b>{q.companyName}</b>
            <br />
            {q.address}
            {q.city && (
              <>
                <br />
                {q.city}
              </>
            )}
            <br />
            {q.country}
          </div>
          {q.notes && <p className="ac-notes">“{q.notes}”</p>}
        </div>
      </div>
    </div>
  );
}
