import type { Metadata } from "next";
import Link from "next/link";

import { getAdminNews } from "@/lib/admin/news";
import { NEWS_STATUS_LABELS, NEWS_STATUS_PILL } from "@/lib/admin/news-editor-types";
import { AdminTopbar } from "../AdminTopbar";
import { NewsRowActions } from "./NewsRowActions";

export const metadata: Metadata = { title: "Newsroom" };

export default async function AdminNewsPage() {
  const { rows, summary } = await getAdminNews();

  const stats: [string, number][] = [
    ["Toplam", summary.total],
    ["Yayında", summary.published],
    ["Taslak", summary.draft],
  ];

  return (
    <>
      <AdminTopbar title="Newsroom" crumbs={["Moniva Yönetim", "İçerik", "Newsroom"]} />

      <div className="ad-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__title">
              <span>Haberler</span>
            </div>
            <div className="iq-head__meta">
              {stats.map(([l, v], i) => (
                <span key={l}>
                  {i > 0 && <span className="ad-sep"> · </span>}
                  <b>{v}</b> {l}
                </span>
              ))}
            </div>
          </div>
          <div className="iq-head__actions">
            <Link href="/admin/news/new" className="ad-btn ad-btn--primary">
              + Yeni haber
            </Link>
          </div>
        </div>

        <div className="ad-card ad-card--flush">
          {rows.length === 0 ? (
            <div className="ad-empty" style={{ padding: 40, textAlign: "center" }}>
              Henüz haber yok. <Link href="/admin/news/new">İlk haberi oluşturun.</Link>
            </div>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Kapak</th>
                  <th>Başlık</th>
                  <th className="ad-num">Diller</th>
                  <th>Durum</th>
                  <th>Yayın</th>
                  <th style={{ textAlign: "right" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverImage} alt="" className="ad-newsthumb" />
                      ) : (
                        <div className="ad-newsthumb ad-newsthumb--empty">—</div>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/news/${r.id}`} style={{ fontWeight: 600 }}>
                        {r.title}
                      </Link>
                      <div className="ad-mono ad-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        /haberler/{r.slug}
                      </div>
                    </td>
                    <td className="ad-num ad-muted">{r.localeCount}/4</td>
                    <td>
                      <span className={"ad-pill ad-pill--" + NEWS_STATUS_PILL[r.status]}>
                        {NEWS_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="ad-muted">{r.publishedLabel ?? "—"}</td>
                    <td>
                      <NewsRowActions id={r.id} status={r.status} title={r.title} />
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
