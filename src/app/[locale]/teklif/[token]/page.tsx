import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { getPublicQuoteByToken } from "@/lib/quotes/public-quote";
import { formatMoney } from "@/lib/admin/quote-pricing";
import { QuoteViewTracker } from "./QuoteViewTracker";
import { QuoteDecisions } from "./QuoteDecisions";
import "./quote-public.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quote.public" });
  return {
    title: t("pageTitle"),
    robots: { index: false, follow: false },
  };
}

// Müşteriye dönük sonuçlanmış durum → messages key haritası.
const DECIDED_KEY: Partial<Record<QuoteStatus, { key: string; kind: string }>> = {
  APPROVED: { key: "approved", kind: "ok" },
  REVISION_REQUESTED: { key: "revisionRequested", kind: "warn" },
  DECLINED: { key: "declined", kind: "mute" },
  CLOSED: { key: "closed", kind: "mute" },
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const q = await getPublicQuoteByToken(token);
  if (!q) notFound();

  const t = await getTranslations();
  const money = (n: number) => formatMoney(n, q.currency);
  const decided = DECIDED_KEY[q.status];

  return (
    <div className="pq">
      <QuoteViewTracker token={token} />

      <div className="pq-sheet">
        <header className="pq-head">
          <Image
            src="/brand/moniva-logo.png"
            alt="Moniva"
            width={132}
            height={40}
            className="pq-logo"
            priority
          />
          <div className="pq-head__right">
            <div className="pq-title">{t("quote.public.title")}</div>
            <div className="pq-ref">{q.ref}</div>
            {q.sentAtLabel && (
              <div className="pq-date">
                {t("quote.public.editedAt")} {q.sentAtLabel}
              </div>
            )}
          </div>
        </header>

        {q.isExpired ? (
          <div className="pq-note pq-note--expired">
            {t("quote.public.expired")}
          </div>
        ) : decided ? (
          <div className={`pq-note pq-note--${decided.kind}`}>
            {t(`quote.public.decidedLabels.${decided.key}`)}
          </div>
        ) : null}

        <section className="pq-to">
          <span className="pq-block__ttl">{t("quote.public.to")}</span>
          <div className="pq-to__co">{q.companyName}</div>
          {q.fullName && <div className="pq-to__name">{q.fullName}</div>}
        </section>

        <div className="pq-tablewrap">
          <table className="pq-table">
            <thead>
              <tr>
                <th className="pq-c-no">{t("quote.public.table.no")}</th>
                <th>{t("quote.public.table.part")}</th>
                <th className="pq-num">{t("quote.public.table.qty")}</th>
                <th className="pq-num">
                  {t("quote.public.table.unit", { currency: q.currency })}
                </th>
                <th className="pq-num">{t("quote.public.table.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={it.id}>
                  <td className="pq-c-no">{i + 1}</td>
                  <td>
                    <div className="pq-sku">{it.sku}</div>
                    <div className="pq-name">{it.name}</div>
                    {it.oem && <div className="pq-oem">{it.oem}</div>}
                  </td>
                  <td className="pq-num">{it.quantity}</td>
                  <td className="pq-num">{money(it.unitPrice)}</td>
                  <td className="pq-num pq-line">
                    {money(it.quantity * it.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pq-summary">
          <div className="pq-terms">
            <div className="pq-block__ttl">{t("quote.public.terms.heading")}</div>
            <dl className="pq-terms__list">
              <div>
                <dt>{t("quote.public.terms.shipping")}</dt>
                <dd>{q.shippingMode ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("quote.public.terms.payment")}</dt>
                <dd>{q.paymentTerms ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("quote.public.terms.validity")}</dt>
                <dd>{q.validUntilLabel ?? "—"}</dd>
              </div>
            </dl>
            <p className="pq-terms__fine">
              {q.vatRate === 0
                ? t("quote.public.terms.fineWithoutVat", { currency: q.currency })
                : t("quote.public.terms.fineWithVat", { currency: q.currency })}
            </p>
          </div>

          <div className="pq-totals">
            <div className="pq-trow">
              <span>{t("quote.public.totals.subtotal")}</span>
              <span>{money(q.totals.subtotal)}</span>
            </div>
            <div className="pq-trow pq-trow--neg">
              <span>
                {t("quote.public.totals.discount", { pct: q.discountPct })}
              </span>
              <span>− {money(q.totals.discountAmount)}</span>
            </div>
            <div className="pq-trow">
              <span>{t("quote.public.totals.shipping")}</span>
              <span>{money(q.totals.shippingCost)}</span>
            </div>
            <div className="pq-trow">
              <span>{t("quote.public.totals.vat", { pct: q.vatRate })}</span>
              <span>{money(q.totals.vatAmount)}</span>
            </div>
            <div className="pq-trow pq-trow--grand">
              <span>{t("quote.public.totals.total")}</span>
              <span>{money(q.totals.total)}</span>
            </div>
          </div>
        </div>

        {!q.isExpired &&
          (q.status === QuoteStatus.QUOTED || q.status === QuoteStatus.VIEWED) && (
            <QuoteDecisions token={token} />
          )}

        <footer className="pq-foot">
          <span>{t("quote.public.footer.tagline")}</span>
          <span>{t("quote.public.footer.domain")}</span>
        </footer>
      </div>
    </div>
  );
}
