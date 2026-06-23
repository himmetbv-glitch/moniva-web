import type { Metadata } from "next";
import Link from "next/link";

import { getAdminCategories } from "@/lib/admin/categories";
import { moveCategoryOrder } from "@/lib/actions/admin-category";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { CategoryRowActions } from "./CategoryRowActions";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function AdminCategoriesPage() {
  const rows = await getAdminCategories();

  return (
    <>
      <AdminTopbar title="Kategoriler" crumbs={["Moniva Yönetim", "Katalog"]} />
      <div className="ad-page">
        <div className="ad-welcome">
          <div>
            <h1 className="ad-welcome__hi">Kategoriler</h1>
            <div className="ad-welcome__sub">
              Ürünler sayfasındaki kategori menüsünü buradan yönetin.
            </div>
          </div>
          <div className="ad-welcome__actions">
            <Link href="/admin/categories/new" className="ad-btn ad-btn--primary">
              <Icons.plus /> Yeni Kategori
            </Link>
          </div>
        </div>

        <div className="ad-card ad-card--flush">
          {rows.length === 0 ? (
            <div className="ad-empty">Henüz kategori yok.</div>
          ) : (
            <table className="ad-table pl-table">
              <thead>
                <tr>
                  <th className="pl-ordcol">Sıra</th>
                  <th>Kategori</th>
                  <th>Slug</th>
                  <th className="ad-num">Ürün</th>
                  <th className="ad-num">Alt</th>
                  <th>Durum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="pl-ordcol">
                      <div className="pl-ord">
                        <form action={moveCategoryOrder}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button
                            type="submit"
                            className="pl-ord__btn"
                            aria-label="Yukarı taşı"
                            disabled={c.isFirst}
                          >
                            ▲
                          </button>
                        </form>
                        <form action={moveCategoryOrder}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button
                            type="submit"
                            className="pl-ord__btn"
                            aria-label="Aşağı taşı"
                            disabled={c.isLast}
                          >
                            ▼
                          </button>
                        </form>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/admin/categories/${c.id}`}
                        className="cat-name"
                        style={{ paddingLeft: c.depth * 22 }}
                      >
                        {c.depth > 0 && <span className="cat-name__branch">└</span>}
                        {c.name}
                        <span className="cat-name__code">{c.code}</span>
                      </Link>
                    </td>
                    <td>
                      <span className="ad-mono ad-muted">/c/{c.slug}</span>
                    </td>
                    <td className="ad-num ad-muted">{c.productCount}</td>
                    <td className="ad-num ad-dim">{c.childCount || "—"}</td>
                    <td>
                      <span className={"ad-pill ad-pill--" + (c.isActive ? "ok" : "mute")}>
                        {c.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td>
                      <CategoryRowActions id={c.id} name={c.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="cat-tip">
          <b>İpucu —</b> Buradaki kategoriler Ürünler sayfasının kenar menüsüne ve
          anasayfa kategori kartlarına yansır. Üst kategori seçerek hiyerarşi kurabilirsiniz.
        </div>
      </div>
    </>
  );
}
