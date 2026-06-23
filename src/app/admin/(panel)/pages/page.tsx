import type { Metadata } from "next";
import Link from "next/link";

import { getAdminPages } from "@/lib/admin/pages";
import { getManagedPageList } from "@/lib/admin/managed-pages";
import { PAGE_STATUS_LABELS, PAGE_STATUS_PILL } from "@/lib/admin/page-editor-types";
import {
  SECTION_STATUS_LABELS,
  SECTION_STATUS_PILL,
} from "@/lib/admin/managed-page-editor-types";
import { AdminTopbar } from "../AdminTopbar";
import { PageRowActions } from "./PageRowActions";

export const metadata: Metadata = { title: "Sayfalar" };

export default async function AdminPagesPage() {
  const [managed, { rows, summary }] = await Promise.all([
    getManagedPageList(),
    getAdminPages(),
  ]);

  const stats: [string, number][] = [
    ["İçerik sayfası", summary.total],
    ["Yayında", summary.published],
    ["Taslak", summary.draft],
  ];

  return (
    <>
      <AdminTopbar title="Sayfalar" crumbs={["Moniva Yönetim", "İçerik", "Sayfalar"]} />

      <div className="ad-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__title">
              <span>Sayfalar</span>
            </div>
            <div className="iq-head__meta">
              moniva.com.tr sayfalarını düzenleyin — bölümleri yönetmek için satıra tıklayın
            </div>
          </div>
          <div className="iq-head__actions">
            <Link href="/admin/pages/new" className="ad-btn ad-btn--primary">
              + Yeni içerik sayfası
            </Link>
          </div>
        </div>

        {/* ── Site sayfaları (bölüm-tabanlı) ── */}
        <div className="ad-card ad-card--flush mp-listcard">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Sayfa</th>
                <th>URL</th>
                <th className="ad-num">Bölüm</th>
                <th>Durum</th>
                <th>Güncelleme</th>
                <th style={{ textAlign: "right" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {managed.map((p) => (
                <tr key={p.key}>
                  <td>
                    <Link href={`/admin/pages/site/${p.key}`} style={{ fontWeight: 600 }}>
                      {p.title}
                    </Link>
                  </td>
                  <td className="ad-mono ad-muted">{p.path}</td>
                  <td className="ad-num ad-muted">{p.sectionCount}</td>
                  <td>
                    <span className={"ad-pill ad-pill--" + SECTION_STATUS_PILL[p.status]}>
                      {SECTION_STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="ad-muted">{p.updatedLabel}</td>
                  <td>
                    <div className="ad-rowact" style={{ justifyContent: "flex-end" }}>
                      <a href={p.path} target="_blank" rel="noreferrer" className="ad-linkbtn">Önizle ↗</a>
                      <Link href={`/admin/pages/site/${p.key}`} className="ad-linkbtn">Düzenle</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {managed.length === 0 && (
                <tr>
                  <td colSpan={6} className="ad-empty" style={{ padding: 28, textAlign: "center" }}>
                    Yönetilen sayfa yok. Seed çalıştırın: <span className="ad-mono">tsx prisma/seed-managed-pages.ts</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── İçerik / yasal sayfalar (CMS) ── */}
        <div className="mp-secttitle">
          <span>İçerik Sayfaları</span>
          <span className="mp-secttitle__meta">
            {stats.map(([l, v], i) => (
              <span key={l}>
                {i > 0 && <span className="ad-sep"> · </span>}
                <b>{v}</b> {l}
              </span>
            ))}
          </span>
        </div>

        <div className="ad-card ad-card--flush">
          {rows.length === 0 ? (
            <div className="ad-empty" style={{ padding: 40, textAlign: "center" }}>
              Henüz içerik sayfası yok. <Link href="/admin/pages/new">İlk sayfayı oluşturun.</Link>{" "}
              KVKK, Gizlilik, Garanti gibi yasal/bilgi sayfaları için.
            </div>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th className="ad-num">Diller</th>
                  <th>Durum</th>
                  <th>Footer</th>
                  <th>Güncelleme</th>
                  <th style={{ textAlign: "right" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/pages/${r.id}`} style={{ fontWeight: 600 }}>
                        {r.title}
                      </Link>
                      <div className="ad-mono ad-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        /sayfa/{r.slug}
                      </div>
                    </td>
                    <td className="ad-num ad-muted">{r.localeCount}/4</td>
                    <td>
                      <span className={"ad-pill ad-pill--" + PAGE_STATUS_PILL[r.status]}>
                        {PAGE_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td>
                      {r.showInFooter ? (
                        <span className="ad-pill ad-pill--info">Evet</span>
                      ) : (
                        <span className="ad-muted">—</span>
                      )}
                    </td>
                    <td className="ad-muted">{r.updatedLabel}</td>
                    <td>
                      <PageRowActions id={r.id} status={r.status} title={r.title} />
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
