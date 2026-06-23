import type { Metadata } from "next";
import Link from "next/link";

import { getAdminCatalogues } from "@/lib/admin/catalogues";
import {
  CAT_STATUS_LABELS,
  CAT_STATUS_PILL,
  formatFileSize,
} from "@/lib/admin/catalogue-editor-types";
import { AdminTopbar } from "../AdminTopbar";
import { CatalogueRowActions } from "./CatalogueRowActions";

export const metadata: Metadata = { title: "Kataloglar" };

export default async function AdminCataloguesPage() {
  const { rows, summary } = await getAdminCatalogues();

  const stats: [string, string, string][] = [
    ["Yayında katalog", String(summary.published), `${summary.draft} taslak`],
    ["Toplam indirme", summary.totalDownloads.toLocaleString("tr-TR"), "tüm zamanlar"],
    ["Diller", String(summary.languages.length), summary.languages.join(" · ") || "—"],
    ["Toplam depolama", formatFileSize(summary.totalStorageBytes), `${summary.total} dosya`],
  ];

  return (
    <>
      <AdminTopbar title="Kataloglar" crumbs={["Moniva Yönetim", "İçerik", "Kataloglar"]} />

      <div className="ad-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__title">
              <span>Kataloglar</span>
            </div>
            <div className="iq-head__meta" style={{ marginTop: -6 }}>
              moniva.com.tr&apos;de sunulan indirilebilir PDF kataloglar — genel katalog,
              ürün aileleri ve marka kılavuzları
            </div>
          </div>
          <div className="iq-head__actions">
            <Link href="/admin/catalogues/turler" className="ad-btn ad-btn--ghost">
              Türleri yönet
            </Link>
            <Link href="/admin/catalogues/new" className="ad-btn ad-btn--primary">
              + Katalog yükle
            </Link>
          </div>
        </div>

        <div className="iq-summary">
          {stats.map(([label, val, sub]) => (
            <div className="iq-summary__cell" key={label}>
              <div className="iq-summary__k">{label}</div>
              <div className="iq-summary__v">{val}</div>
              <div className="iq-summary__k" style={{ marginTop: 2, fontWeight: 400 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="ad-card ad-card--flush">
          {rows.length === 0 ? (
            <div className="ad-empty" style={{ padding: 40, textAlign: "center" }}>
              Henüz katalog yok. <Link href="/admin/catalogues/new">İlk kataloğu yükleyin.</Link>
            </div>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Tip</th>
                  <th className="ad-num">Diller</th>
                  <th className="ad-num">Sürüm / Sayfa</th>
                  <th className="ad-num">Boyut</th>
                  <th className="ad-num">İndirme</th>
                  <th>Durum</th>
                  <th style={{ textAlign: "right" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/catalogues/${r.id}`} style={{ fontWeight: 600 }}>
                        {r.title}
                      </Link>
                      {r.featured && <span className="ad-pill ad-pill--info" style={{ marginLeft: 8 }}>Öne çıkan</span>}
                      <div className="ad-mono ad-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        /kataloglar/{r.slug}
                        {!r.hasFile && <span style={{ color: "var(--warn, #b8860b)" }}> · PDF yok</span>}
                      </div>
                    </td>
                    <td>
                      <span
                        className="ad-pill"
                        style={{ background: `${r.typeColor}22`, color: r.typeColor }}
                      >
                        {r.typeName}
                      </span>
                    </td>
                    <td className="ad-num ad-muted">{r.languages.join(" · ") || "—"}</td>
                    <td className="ad-num ad-muted">
                      {r.version ?? "—"}
                      {r.pageCount ? ` · ${r.pageCount}s` : ""}
                    </td>
                    <td className="ad-num ad-muted">{formatFileSize(r.fileSize)}</td>
                    <td className="ad-num ad-muted">{r.downloadCount.toLocaleString("tr-TR")}</td>
                    <td>
                      <span className={"ad-pill ad-pill--" + CAT_STATUS_PILL[r.status]}>
                        {CAT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td>
                      <CatalogueRowActions
                        id={r.id}
                        status={r.status}
                        title={r.title}
                        hasFile={r.hasFile}
                      />
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
