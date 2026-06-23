import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getApplicationDetail, SUBMISSION_STATUS_PILL } from "@/lib/admin/messages";
import { AdminTopbar } from "../../../AdminTopbar";
import { MessageStatusFlow } from "../../MessageStatusFlow";

export const metadata: Metadata = { title: "İş Başvurusu" };

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getApplicationDetail(id);
  if (!d) notFound();

  const pill = SUBMISSION_STATUS_PILL[d.status];
  const rows: [string, string | null][] = [
    ["Aday", d.fullName],
    ["E-posta", d.email],
    ["Telefon", d.phone],
    ["Konum", d.location],
    ["Departman", d.position],
    ["Deneyim", d.experience],
  ];

  return (
    <>
      <AdminTopbar title="İş Başvurusu" crumbs={["Moniva Yönetim", "Mesajlar"]} />

      <div className="mv-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__crumb">
              <Link href="/admin/messages">MESAJLAR</Link> / BAŞVURU
            </div>
            <div className="iq-head__title">
              <span>{d.fullName}</span>
              <span className={`mv-pill mv-pill--${pill.kind}`}>{pill.label}</span>
            </div>
            <div className="iq-head__meta">
              <b>{d.position}</b>
              <span>·</span>
              <span>{d.createdAtLabel}</span>
            </div>
          </div>
        </div>

        <MessageStatusFlow kind="application" id={d.id} status={d.status} />

        <div className="iq-grid">
          <div className="iq-main">
            <div className="mv-card iq-pad">
              <div className="iq-cardhead">
                <span className="iq-cardhead__ttl">Ön yazı</span>
                <span className="iq-cardhead__sub">
                  moniva.com.tr/kariyer üzerinden
                </span>
              </div>
              <blockquote className="iq-quote msg-pre">{d.coverNote}</blockquote>
            </div>

            <div className="mv-card iq-pad">
              <div className="iq-cardhead">
                <span className="iq-cardhead__ttl">Özgeçmiş (CV)</span>
                <span className="iq-cardhead__sub">Yalnızca yönetici erişimi</span>
              </div>
              {d.hasCv ? (
                <div className="msg-cv">
                  <div className="msg-cv__file">
                    <span className="msg-cv__ico">PDF</span>
                    <span className="msg-cv__name">{d.cvFileName ?? "cv"}</span>
                  </div>
                  <a
                    href={`/admin/messages/application/${d.id}/cv`}
                    className="mv-btn mv-btn--primary"
                  >
                    CV indir ↓
                  </a>
                </div>
              ) : (
                <div className="mv-empty iq-side__empty">
                  Bu başvuruda CV yüklenmemiş.
                </div>
              )}
            </div>
          </div>

          <div className="iq-side">
            <div className="mv-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Aday bilgileri</div>
              <div className="iq-rows">
                {rows.map(([k, v]) => (
                  <div className="iq-row" key={k}>
                    <span className="iq-row__k">{k}</span>
                    <span className="iq-row__v">{v ?? "—"}</span>
                  </div>
                ))}
              </div>
              {d.linkedinUrl && (
                <a
                  href={d.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mv-btn mv-btn--ghost iq-side__btn"
                >
                  LinkedIn ↗
                </a>
              )}
              <a
                href={`mailto:${d.email}`}
                className="mv-btn mv-btn--ghost iq-side__btn"
              >
                E-posta gönder ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
