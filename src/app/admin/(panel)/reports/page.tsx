import type { Metadata } from "next";
import Link from "next/link";

import { getQuoteReport, type ReportMetric } from "@/lib/admin/quote-report";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { STATUS_PILL } from "../inquiries/status";

export const metadata: Metadata = { title: "Aylık Özet" };

const nf = new Intl.NumberFormat("tr-TR");

function Card({
  label,
  metric,
  tone,
  hint,
}: {
  label: string;
  metric: ReportMetric;
  tone: string;
  hint: string;
}) {
  return (
    <div className={`mv-stat rp-card rp-card--${tone}`}>
      <div className="mv-stat__label">{label}</div>
      <div className="mv-stat__row">
        <div className="mv-stat__val">{nf.format(metric.count)}</div>
      </div>
      <div className="rp-card__amount">{metric.amountLabel}</div>
      <div className="mv-stat__sub">{hint}</div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const r = await getQuoteReport(sp.month);

  return (
    <>
      <AdminTopbar title="Aylık Özet" crumbs={["Moniva Yönetim", "Satış"]} />

      <div className="mv-page">
        <div className="mv-welcome">
          <div>
            <h1 className="mv-welcome__hi">Aylık Teklif Özeti</h1>
            <div className="mv-welcome__sub">
              Seçili ayda gönderilen tekliflerin açılma, onay ve kayıp durumu.
            </div>
          </div>
          <div className="mv-welcome__actions">
            <a
              className="mv-btn mv-btn--ghost"
              href="/api/admin/reports/quotes"
              title="Tüm teklif taleplerini CSV indir"
            >
              <Icons.exp /> CSV indir
            </a>
          </div>
        </div>

        {/* Ay gezinme */}
        <div className="rp-monthnav">
          <Link
            className="rp-monthnav__btn"
            href={`/admin/reports?month=${r.prevMonth}`}
            aria-label="Önceki ay"
          >
            ‹
          </Link>
          <span className="rp-monthnav__label">{r.monthLabel}</span>
          {r.nextMonth ? (
            <Link
              className="rp-monthnav__btn"
              href={`/admin/reports?month=${r.nextMonth}`}
              aria-label="Sonraki ay"
            >
              ›
            </Link>
          ) : (
            <span className="rp-monthnav__btn rp-monthnav__btn--off" aria-hidden>
              ›
            </span>
          )}
        </div>

        {/* Özet kartları */}
        <div className="rp-cards">
          <Card
            label="Gönderilen"
            metric={r.sent}
            tone="sent"
            hint="Bu ay fiyatlanıp gönderildi"
          />
          <Card
            label="Açılan"
            metric={r.opened}
            tone="open"
            hint="Müşteri teklifi görüntüledi"
          />
          <Card
            label="Onaylanan"
            metric={r.approved}
            tone="ok"
            hint="Müşteri onayladı"
          />
          <Card
            label="Cevapsız"
            metric={r.pending}
            tone="wait"
            hint="Karar bekleniyor"
          />
          <Card
            label="Kaybedilen"
            metric={r.lost}
            tone="lost"
            hint="Uygun değil / süre doldu"
          />
        </div>

        {/* Detay tablo */}
        <div className="mv-card mv-card--flush">
          <div className="mv-card__head">
            <div className="mv-card__title">{r.monthLabel} — gönderilen teklifler</div>
            <span className="mv-card__sub">{nf.format(r.sent.count)} kayıt</span>
          </div>
          {r.rows.length === 0 ? (
            <div className="mv-empty">Bu ay gönderilmiş teklif yok.</div>
          ) : (
            <table className="mv-table iq-table">
              <thead>
                <tr>
                  <th>Referans</th>
                  <th>Firma</th>
                  <th>Gönderim</th>
                  <th>Durum</th>
                  <th className="mv-num">Görüntülenme</th>
                  <th className="mv-num">Tutar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {r.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/admin/inquiries/${row.id}`}
                        className="mv-mono mv-ref"
                      >
                        {row.ref}
                      </Link>
                    </td>
                    <td>
                      <div className="mv-co">{row.companyName}</div>
                    </td>
                    <td className="mv-dim">{row.sentAtLabel}</td>
                    <td>
                      <span className={`mv-pill mv-pill--${STATUS_PILL[row.status].kind}`}>
                        {STATUS_PILL[row.status].label}
                      </span>
                    </td>
                    <td className="mv-num mv-muted">
                      {row.viewCount > 0 ? row.viewCount : "—"}
                    </td>
                    <td className="mv-num rp-amount">{row.amountLabel}</td>
                    <td>
                      <Link href={`/admin/inquiries/${row.id}`} className="iq-open">
                        Aç ▶
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
