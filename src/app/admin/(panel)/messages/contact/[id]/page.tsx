import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getContactDetail, SUBMISSION_STATUS_PILL } from "@/lib/admin/messages";
import { AdminTopbar } from "../../../AdminTopbar";
import { MessageStatusFlow } from "../../MessageStatusFlow";

export const metadata: Metadata = { title: "İletişim Mesajı" };

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getContactDetail(id);
  if (!d) notFound();

  const pill = SUBMISSION_STATUS_PILL[d.status];
  const rows: [string, string | null][] = [
    ["Gönderen", d.fullName],
    ["E-posta", d.email],
    ["Telefon", d.phone],
    ["Firma", d.company],
    ["Konu", d.subject],
  ];

  return (
    <>
      <AdminTopbar title="İletişim Mesajı" crumbs={["Moniva Yönetim", "Mesajlar"]} />

      <div className="ad-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__crumb">
              <Link href="/admin/messages">MESAJLAR</Link> / İLETİŞİM
            </div>
            <div className="iq-head__title">
              <span>{d.fullName}</span>
              <span className={`ad-pill ad-pill--${pill.kind}`}>{pill.label}</span>
            </div>
            <div className="iq-head__meta">
              {d.subject && (
                <>
                  <b>{d.subject}</b>
                  <span>·</span>
                </>
              )}
              <span>{d.createdAtLabel}</span>
            </div>
          </div>
        </div>

        <MessageStatusFlow kind="contact" id={d.id} status={d.status} />

        <div className="iq-grid">
          <div className="iq-main">
            <div className="ad-card iq-pad">
              <div className="iq-cardhead">
                <span className="iq-cardhead__ttl">Mesaj</span>
                <span className="iq-cardhead__sub">
                  moniva.com.tr/iletisim üzerinden
                </span>
              </div>
              <blockquote className="iq-quote msg-pre">{d.message}</blockquote>
            </div>
          </div>

          <div className="iq-side">
            <div className="ad-card iq-pad">
              <div className="iq-cardhead__ttl iq-side__ttl">Gönderen bilgileri</div>
              <div className="iq-rows">
                {rows.map(([k, v]) => (
                  <div className="iq-row" key={k}>
                    <span className="iq-row__k">{k}</span>
                    <span className="iq-row__v">{v ?? "—"}</span>
                  </div>
                ))}
              </div>
              <a
                href={`mailto:${d.email}`}
                className="ad-btn ad-btn--ghost iq-side__btn"
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
