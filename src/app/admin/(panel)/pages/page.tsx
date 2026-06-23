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

      <div className="mv-page">
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
            <Link href="/admin/pages/new" className="mv-btn mv-btn--primary">
              + Yeni içerik sayfası
            </Link>
          </div>
        </div>

        {/* ── Site sayfaları (bölüm-tabanlı) ── */}
        <div className="mv-card mv-card--flush mp-listcard">
          <table className="mv-table">
            <thead>
              <tr>
                <th>Sayfa</th>
                <th>URL</th>
                <th className="mv-num">Bölüm</th>
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
                  <td className="mv-mono mv-muted">{p.path}</td>
                  <td className="mv-num mv-muted">{p.sectionCount}</td>
                  <td>
                    <span className={"mv-pill mv-pill--" + SECTION_STATUS_PILL[p.status]}>
                      {SECTION_STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="mv-muted">{p.updatedLabel}</td>
                  <td>
                    <div className="mv-rowact" style={{ justifyContent: "flex-end" }}>
                      <a href={p.path} target="_blank" rel="noreferrer" className="mv-linkbtn">Önizle ↗</a>
                      <Link href={`/admin/pages/site/${p.key}`} className="mv-linkbtn">Düzenle</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {managed.length === 0 && (
                <tr>
                  <td colSpan={6} className="mv-empty" style={{ padding: 28, textAlign: "center" }}>
                    Yönetilen sayfa yok. Seed çalıştırın: <span className="mv-mono">tsx prisma/seed-managed-pages.ts</span>
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
                {i > 0 && <span className="mv-sep"> · </span>}
                <b>{v}</b> {l}
              </span>
            ))}
          </span>
        </div>

        <div className="mv-card mv-card--flush">
          {rows.length === 0 ? (
            <div className="mv-empty" style={{ padding: 40, textAlign: "center" }}>
              Henüz içerik sayfası yok. <Link href="/admin/pages/new">İlk sayfayı oluşturun.</Link>{" "}
              KVKK, Gizlilik, Garanti gibi yasal/bilgi sayfaları için.
            </div>
          ) : (
            <table className="mv-table">
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th className="mv-num">Diller</th>
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
                      <div className="mv-mono mv-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        /sayfa/{r.slug}
                      </div>
                    </td>
                    <td className="mv-num mv-muted">{r.localeCount}/4</td>
                    <td>
                      <span className={"mv-pill mv-pill--" + PAGE_STATUS_PILL[r.status]}>
                        {PAGE_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td>
                      {r.showInFooter ? (
                        <span className="mv-pill mv-pill--info">Evet</span>
                      ) : (
                        <span className="mv-muted">—</span>
                      )}
                    </td>
                    <td className="mv-muted">{r.updatedLabel}</td>
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
