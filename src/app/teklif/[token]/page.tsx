import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";

import { getPublicQuoteByToken } from "@/lib/quotes/public-quote";
import { formatMoney } from "@/lib/admin/quote-pricing";
import { QuoteViewTracker } from "./QuoteViewTracker";
import { QuoteDecisions } from "./QuoteDecisions";
import "./quote-public.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiyat Teklifiniz — Moniva",
  robots: { index: false, follow: false },
};

// Müşteriye dönük, sonuçlanmış durum etiketleri (sadece bilgilendirme).
const DECIDED_LABEL: Partial<Record<QuoteStatus, { text: string; kind: string }>> = {
  APPROVED: { text: "Teklifi onayladınız", kind: "ok" },
  REVISION_REQUESTED: { text: "Revizyon talebiniz alındı", kind: "warn" },
  DECLINED: { text: "Bu teklif kapatıldı", kind: "mute" },
  CLOSED: { text: "Bu teklif kapatıldı", kind: "mute" },
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const q = await getPublicQuoteByToken(token);
  if (!q) notFound();

  const money = (n: number) => formatMoney(n, q.currency);
  const decided = DECIDED_LABEL[q.status];

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
            <div className="pq-title">FİYAT TEKLİFİ</div>
            <div className="pq-ref">{q.ref}</div>
            {q.sentAtLabel && <div className="pq-date">Düzenlenme: {q.sentAtLabel}</div>}
          </div>
        </header>

        {q.isExpired ? (
          <div className="pq-note pq-note--expired">
            Bu teklifin geçerlilik süresi doldu. Güncel fiyat için lütfen bizimle
            iletişime geçin.
          </div>
        ) : decided ? (
          <div className={`pq-note pq-note--${decided.kind}`}>{decided.text}</div>
        ) : null}

        <section className="pq-to">
          <span className="pq-block__ttl">SAYIN</span>
          <div className="pq-to__co">{q.companyName}</div>
          {q.fullName && <div className="pq-to__name">{q.fullName}</div>}
        </section>

        <div className="pq-tablewrap">
          <table className="pq-table">
            <thead>
              <tr>
                <th className="pq-c-no">#</th>
                <th>Parça</th>
                <th className="pq-num">Adet</th>
                <th className="pq-num">Birim ({q.currency})</th>
                <th className="pq-num">Tutar</th>
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
                  <td className="pq-num pq-line">{money(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pq-summary">
          <div className="pq-terms">
            <div className="pq-block__ttl">ŞARTLAR</div>
            <dl className="pq-terms__list">
              <div>
                <dt>Teslim şekli</dt>
                <dd>{q.shippingMode ?? "—"}</dd>
              </div>
              <div>
                <dt>Ödeme vadesi</dt>
                <dd>{q.paymentTerms ?? "—"}</dd>
              </div>
              <div>
                <dt>Geçerlilik</dt>
                <dd>{q.validUntilLabel ?? "—"}</dd>
              </div>
            </dl>
            <p className="pq-terms__fine">
              Fiyatlar {q.currency} cinsindendir
              {q.vatRate === 0 ? " ve KDV hariçtir." : "."} Stok ve teslim süreleri
              sipariş onayında teyit edilir. Bu belge bir fiyat teklifidir, fatura
              yerine geçmez.
            </p>
          </div>

          <div className="pq-totals">
            <div className="pq-trow">
              <span>Ara toplam</span>
              <span>{money(q.totals.subtotal)}</span>
            </div>
            <div className="pq-trow pq-trow--neg">
              <span>İskonto ({q.discountPct}%)</span>
              <span>− {money(q.totals.discountAmount)}</span>
            </div>
            <div className="pq-trow">
              <span>Navlun</span>
              <span>{money(q.totals.shippingCost)}</span>
            </div>
            <div className="pq-trow">
              <span>KDV ({q.vatRate}%)</span>
              <span>{money(q.totals.vatAmount)}</span>
            </div>
            <div className="pq-trow pq-trow--grand">
              <span>Genel Toplam</span>
              <span>{money(q.totals.total)}</span>
            </div>
          </div>
        </div>

        {!q.isExpired &&
          (q.status === QuoteStatus.QUOTED || q.status === QuoteStatus.VIEWED) && (
            <QuoteDecisions token={token} />
          )}

        <footer className="pq-foot">
          <span>Moniva · Ağır Vasıta &amp; Treyler Yedek Parça</span>
          <span>moniva.com.tr</span>
        </footer>
      </div>
    </div>
  );
}
