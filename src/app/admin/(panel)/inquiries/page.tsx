import type { Metadata } from "next";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";

import { getInquiryList } from "@/lib/admin/inquiries";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { STATUS_PILL, PRIORITY } from "./status";

export const metadata: Metadata = { title: "Teklif Talepleri" };

const STATUS_TABS: { key: string; label: string; value?: QuoteStatus }[] = [
  { key: "all", label: "Tümü" },
  { key: "new", label: "Yeni", value: QuoteStatus.NEW },
  { key: "quoted", label: "Teklif Verildi", value: QuoteStatus.QUOTED },
  { key: "closed", label: "Kapandı", value: QuoteStatus.CLOSED },
  { key: "archived", label: "Arşiv" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const archivedView = sp.status === "archived";
  const statusFilter =
    !archivedView && sp.status && sp.status in QuoteStatus
      ? (sp.status as QuoteStatus)
      : undefined;
  const q = sp.q ?? "";

  const { rows, summary } = await getInquiryList(statusFilter, q, archivedView);

  const summaryCells = [
    { k: "Yeni", v: summary.newCount },
    { k: "Teklif Verildi", v: summary.quoted },
    { k: "Kapandı", v: summary.closed },
    { k: "Bu hafta", v: summary.weekCount },
    { k: "Arşiv", v: summary.archived },
  ];

  return (
    <>
      <AdminTopbar title="Teklif Talepleri" crumbs={["Moniva Yönetim", "Satış"]} />

      <div className="ad-page">
        <div className="ad-welcome">
          <div>
            <h1 className="ad-welcome__hi">Teklif Talepleri</h1>
            <div className="ad-welcome__sub">
              Katalogdan ve iletişim formlarından gelen teklif talepleri.
            </div>
          </div>
          <div className="ad-welcome__actions">
            <a className="ad-btn ad-btn--ghost" href="/api/admin/reports/quotes" title="Tüm teklif taleplerini CSV indir">
              <Icons.exp /> CSV indir
            </a>
          </div>
        </div>

        {/* Özet şerit */}
        <div className="iq-summary">
          {summaryCells.map((s) => (
            <div className="iq-summary__cell" key={s.k}>
              <div className="iq-summary__k">{s.k}</div>
              <div className="iq-summary__v">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Filtre */}
        <div className="iq-filter">
          <form className="iq-search" action="/admin/inquiries" method="get">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            {archivedView && <input type="hidden" name="status" value="archived" />}
            <span className="iq-search__ico">
              <Icons.search />
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Firma, kişi veya e-posta ile ara…"
            />
          </form>
          <div className="iq-tabs">
            {STATUS_TABS.map((t) => {
              const active =
                t.key === "archived"
                  ? archivedView
                  : t.key === "all"
                    ? !statusFilter && !archivedView
                    : (t.value ?? undefined) === statusFilter && !archivedView;
              const href =
                t.key === "all"
                  ? "/admin/inquiries"
                  : t.key === "archived"
                    ? "/admin/inquiries?status=archived"
                    : `/admin/inquiries?status=${t.value}`;
              return (
                <Link
                  key={t.key}
                  href={href}
                  className={"iq-tab" + (active ? " iq-tab--on" : "")}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tablo */}
        <div className="ad-card ad-card--flush">
          {rows.length === 0 ? (
            <div className="ad-empty">Bu filtreye uygun teklif talebi yok.</div>
          ) : (
            <table className="ad-table iq-table">
              <thead>
                <tr>
                  <th>Referans</th>
                  <th>Firma / İletişim</th>
                  <th>Ülke</th>
                  <th className="ad-num">Parça</th>
                  <th>Öncelik</th>
                  <th>Durum</th>
                  <th>Geliş</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/inquiries/${r.id}`} className="ad-mono ad-ref">
                        {r.ref}
                      </Link>
                    </td>
                    <td>
                      <div className="ad-co">{r.companyName}</div>
                      <div className="ad-co__sub">{r.email}</div>
                    </td>
                    <td className="ad-muted">{r.country}</td>
                    <td className="ad-num ad-muted">{r.itemCount}</td>
                    <td>
                      <span className={`iq-prio iq-prio--${r.priority}`}>
                        ● {PRIORITY[r.priority]}
                      </span>
                    </td>
                    <td>
                      <span className={`ad-pill ad-pill--${STATUS_PILL[r.status].kind}`}>
                        {STATUS_PILL[r.status].label}
                      </span>
                    </td>
                    <td className="ad-dim">{r.timeLabel}</td>
                    <td>
                      <Link href={`/admin/inquiries/${r.id}`} className="iq-open">
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
