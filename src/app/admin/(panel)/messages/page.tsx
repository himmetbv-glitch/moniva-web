import type { Metadata } from "next";
import Link from "next/link";

import {
  getMessageList,
  SUBMISSION_STATUS_PILL,
  type SubmissionKind,
} from "@/lib/admin/messages";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";

export const metadata: Metadata = { title: "Mesajlar" };

const KIND_TABS: { key: string; label: string; value?: SubmissionKind }[] = [
  { key: "all", label: "Tümü" },
  { key: "contact", label: "İletişim", value: "contact" },
  { key: "application", label: "İş Başvuruları", value: "application" },
];

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "Hepsi" },
  { key: "NEW", label: "Yeni" },
  { key: "REVIEWED", label: "İncelendi" },
  { key: "ARCHIVED", label: "Arşiv" },
];

function hrefFor(kind?: string, status?: string, q?: string): string {
  const p = new URLSearchParams();
  if (kind) p.set("kind", kind);
  if (status) p.set("status", status);
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `/admin/messages?${s}` : "/admin/messages";
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const kind: SubmissionKind | undefined =
    sp.kind === "contact" || sp.kind === "application" ? sp.kind : undefined;
  const status =
    sp.status === "NEW" || sp.status === "REVIEWED" || sp.status === "ARCHIVED"
      ? sp.status
      : undefined;
  const q = sp.q ?? "";

  const { rows, summary } = await getMessageList(kind, status, q);

  const summaryCells = [
    { k: "Yeni", v: summary.newCount },
    { k: "İncelendi", v: summary.reviewed },
    { k: "Arşiv", v: summary.archived },
    { k: "İletişim", v: summary.contactCount },
    { k: "Başvuru", v: summary.applicationCount },
    { k: "Toplam", v: summary.total },
  ];

  return (
    <>
      <AdminTopbar title="Mesajlar" crumbs={["Moniva Yönetim", "Satış"]} />

      <div className="ad-page">
        <div className="ad-welcome">
          <div>
            <h1 className="ad-welcome__hi">Mesajlar & Başvurular</h1>
            <div className="ad-welcome__sub">
              İletişim formundan gelen mesajlar ve kariyer başvuruları.
            </div>
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
          <form className="iq-search" action="/admin/messages" method="get">
            {kind && <input type="hidden" name="kind" value={kind} />}
            {status && <input type="hidden" name="status" value={status} />}
            <span className="iq-search__ico">
              <Icons.search />
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="İsim, e-posta, firma veya konu ile ara…"
            />
          </form>
          <div className="iq-tabs">
            {KIND_TABS.map((t) => {
              const active = (t.value ?? undefined) === kind;
              return (
                <Link
                  key={t.key}
                  href={hrefFor(t.value, status, q)}
                  className={"iq-tab" + (active ? " iq-tab--on" : "")}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Durum alt-filtresi */}
        <div className="msg-statusbar">
          {STATUS_TABS.map((t) => {
            const value = t.key === "all" ? undefined : t.key;
            const active = (value ?? undefined) === status;
            return (
              <Link
                key={t.key}
                href={hrefFor(kind, value, q)}
                className={"msg-chip" + (active ? " msg-chip--on" : "")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Tablo */}
        <div className="ad-card ad-card--flush">
          {rows.length === 0 ? (
            <div className="ad-empty">Bu filtreye uygun mesaj yok.</div>
          ) : (
            <table className="ad-table msg-table">
              <thead>
                <tr>
                  <th>Tür</th>
                  <th>Gönderen</th>
                  <th>Konu / Pozisyon</th>
                  <th>Durum</th>
                  <th>Geliş</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const href =
                    r.kind === "contact"
                      ? `/admin/messages/contact/${r.id}`
                      : `/admin/messages/application/${r.id}`;
                  const pill = SUBMISSION_STATUS_PILL[r.status];
                  return (
                    <tr key={`${r.kind}-${r.id}`}>
                      <td>
                        <span className={`msg-kind msg-kind--${r.kind}`}>
                          {r.kind === "contact" ? "İletişim" : "Başvuru"}
                        </span>
                      </td>
                      <td>
                        <Link href={href} className="ad-co ad-ref">
                          {r.name}
                        </Link>
                        <div className="ad-co__sub">{r.email}</div>
                      </td>
                      <td className="ad-muted">
                        {r.subtitle}
                        {r.hasCv && <span className="msg-cvtag">CV</span>}
                      </td>
                      <td>
                        <span className={`ad-pill ad-pill--${pill.kind}`}>
                          {pill.label}
                        </span>
                      </td>
                      <td className="ad-dim">{r.timeLabel}</td>
                      <td>
                        <Link href={href} className="iq-open">
                          Aç ▶
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
