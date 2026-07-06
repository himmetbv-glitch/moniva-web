import type { Metadata } from "next";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";

import { getInquiryList } from "@/lib/admin/inquiries";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { STATUS_PILL } from "./status";
import { CopyLinkButton } from "./CopyLinkButton";

export const metadata: Metadata = { title: "Teklif Talepleri" };

// Filtre anahtarı → durum kümesi. Takip odaklı sekmeler (açılmadı / sıcak / revizyon).
const FILTERS: Record<string, QuoteStatus[]> = {
  new: [QuoteStatus.NEW],
  unopened: [QuoteStatus.QUOTED],
  hot: [QuoteStatus.VIEWED],
  revision: [QuoteStatus.REVISION_REQUESTED],
  approved: [QuoteStatus.APPROVED],
  closed: [QuoteStatus.CLOSED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "new", label: "Yeni" },
  { key: "unopened", label: "Açılmadı" },
  { key: "hot", label: "Sıcak" },
  { key: "revision", label: "Revizyon" },
  { key: "approved", label: "Onaylandı" },
  { key: "closed", label: "Kapandı" },
  { key: "archived", label: "Arşiv" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const key = sp.status ?? "all";
  const archivedView = key === "archived";
  const statusFilter: QuoteStatus[] | undefined = archivedView
    ? undefined
    : key in FILTERS
      ? FILTERS[key]
      : key in QuoteStatus
        ? [key as QuoteStatus]
        : undefined;
  const currentKey = statusFilter || archivedView ? key : "all";
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

      <div className="mv-page">
        <div className="mv-welcome">
          <div>
            <h1 className="mv-welcome__hi">Teklif Talepleri</h1>
            <div className="mv-welcome__sub">
              Katalogdan ve iletişim formlarından gelen teklif talepleri.
            </div>
          </div>
          <div className="mv-welcome__actions">
            <a className="mv-btn mv-btn--ghost" href="/api/admin/reports/quotes" title="Tüm teklif taleplerini CSV indir">
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
            {currentKey !== "all" && (
              <input type="hidden" name="status" value={currentKey} />
            )}
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
              const active = currentKey === t.key;
              const href =
                t.key === "all"
                  ? "/admin/inquiries"
                  : `/admin/inquiries?status=${t.key}`;
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
        <div className="mv-card mv-card--flush">
          {rows.length === 0 ? (
            <div className="mv-empty">Bu filtreye uygun teklif talebi yok.</div>
          ) : (
            <table className="mv-table iq-table">
              <thead>
                <tr>
                  <th>Referans</th>
                  <th>Firma / İletişim</th>
                  <th>Ülke</th>
                  <th className="mv-num">Parça</th>
                  <th>Durum</th>
                  <th className="mv-num">Görüntülenme</th>
                  <th>Son Hareket</th>
                  <th>Link</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/inquiries/${r.id}`} className="mv-mono mv-ref">
                        {r.ref}
                      </Link>
                    </td>
                    <td>
                      <div className="mv-co">{r.companyName}</div>
                      <div className="mv-co__sub">{r.email}</div>
                    </td>
                    <td className="mv-muted">{r.country}</td>
                    <td className="mv-num mv-muted">{r.itemCount}</td>
                    <td>
                      <span className={`mv-pill mv-pill--${STATUS_PILL[r.status].kind}`}>
                        {STATUS_PILL[r.status].label}
                      </span>
                    </td>
                    <td className="mv-num">
                      {r.viewCount > 0 ? (
                        <span className="iq-views" title="Toplam görüntülenme">
                          <span className="iq-views__ico" aria-hidden>
                            👁
                          </span>
                          {r.viewCount}
                        </span>
                      ) : (
                        <span className="mv-dim">—</span>
                      )}
                    </td>
                    <td className="mv-dim">{r.lastActivityLabel}</td>
                    <td>
                      {r.publicToken ? (
                        <CopyLinkButton token={r.publicToken} />
                      ) : (
                        <span className="mv-dim">—</span>
                      )}
                    </td>
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
