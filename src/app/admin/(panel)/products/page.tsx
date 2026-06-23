import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getAdminProducts, type AdminProductFilters } from "@/lib/admin/products";
import { moveProductOrder } from "@/lib/actions/admin-product";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { RowActions } from "./RowActions";

export const metadata: Metadata = { title: "Ürünler" };

const nf = new Intl.NumberFormat("tr-TR");

type SP = {
  q?: string;
  status?: string;
  featured?: string;
  kategori?: string;
  sort?: string;
  sayfa?: string;
};

const STATUS_TABS = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Aktif" },
  { key: "inactive", label: "Pasif" },
  { key: "featured", label: "Öne Çıkan" },
];

function buildQuery(base: SP, patch: Partial<SP>): string {
  const merged = { ...base, ...patch };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.status) params.set("status", merged.status);
  if (merged.featured) params.set("featured", merged.featured);
  if (merged.kategori) params.set("kategori", merged.kategori);
  if (merged.sort && merged.sort !== "guncel") params.set("sort", merged.sort);
  if (merged.sayfa && merged.sayfa !== "1") params.set("sayfa", merged.sayfa);
  const s = params.toString();
  return s ? `/admin/products?${s}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const sortMode = sp.sort === "sira" ? "sira" : "guncel";
  const filters: AdminProductFilters = {
    q: sp.q,
    status: sp.status === "active" || sp.status === "inactive" ? sp.status : undefined,
    featured: sp.featured === "1" || sp.status === "featured",
    kategori: sp.kategori || undefined,
    sort: sortMode,
    page: sp.sayfa ? parseInt(sp.sayfa, 10) || 1 : 1,
  };
  const activeTab = sp.status === "featured" || sp.featured === "1"
    ? "featured"
    : (filters.status ?? "all");

  const { rows, total, page, pageCount, counts, categoryOptions } =
    await getAdminProducts(filters);

  const reorderable = sortMode === "sira";
  const scope = { q: sp.q, status: filters.status, kategori: filters.kategori };

  const exportParams = new URLSearchParams();
  if (sp.q) exportParams.set("q", sp.q);
  if (sp.status) exportParams.set("status", sp.status);
  if (sp.kategori) exportParams.set("kategori", sp.kategori);
  if (sp.featured) exportParams.set("featured", sp.featured);
  const exportHref =
    "/api/admin/products/export" +
    (exportParams.toString() ? `?${exportParams.toString()}` : "");

  return (
    <>
      <AdminTopbar title="Ürünler" crumbs={["Moniva Yönetim", "Katalog"]} />

      <div className="mv-page">
        {/* Header */}
        <div className="mv-welcome">
          <div>
            <h1 className="mv-welcome__hi">Ürün Kataloğu</h1>
            <div className="mv-welcome__sub">
              <b>{nf.format(counts.products)}</b> ürün · <b>{nf.format(counts.categories)}</b> kategori ·{" "}
              <b>{nf.format(counts.brands)}</b> marka · <b>{nf.format(counts.rfq30d)}</b> teklif (30g)
            </div>
          </div>
          <div className="mv-welcome__actions">
            <Link href="/admin/products/import" className="mv-btn mv-btn--ghost">
              <Icons.exp /> Toplu Import
            </Link>
            <a href={exportHref} className="mv-btn mv-btn--ghost">
              <Icons.exp /> Dışa Aktar
            </a>
            <Link href="/admin/products/new" className="mv-btn mv-btn--primary">
              <Icons.plus /> Yeni Ürün
            </Link>
          </div>
        </div>

        {/* Filtre */}
        <div className="iq-filter">
          <form className="iq-search" action="/admin/products" method="get">
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            <span className="iq-search__ico">
              <Icons.search />
            </span>
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Ad, MNV referansı veya OEM no ile ara…"
            />
          </form>
          <div className="iq-tabs">
            {STATUS_TABS.map((t) => {
              const href =
                t.key === "all"
                  ? buildQuery({ q: sp.q, kategori: sp.kategori, sort: sp.sort }, {})
                  : t.key === "featured"
                    ? buildQuery({ q: sp.q, kategori: sp.kategori, sort: sp.sort }, { status: "featured" })
                    : buildQuery({ q: sp.q, kategori: sp.kategori, sort: sp.sort }, { status: t.key });
              return (
                <Link
                  key={t.key}
                  href={href}
                  className={"iq-tab" + (activeTab === t.key ? " iq-tab--on" : "")}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Kategori + sıralama modu */}
        <div className="pl-toolbar">
          <form className="pl-catfilter" action="/admin/products" method="get">
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            {reorderable && <input type="hidden" name="sort" value="sira" />}
            <span className="pl-catfilter__lbl">Kategori</span>
            <select name="kategori" defaultValue={sp.kategori ?? ""} className="pl-catfilter__sel">
              <option value="">Tüm kategoriler</option>
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="mv-btn mv-btn--ghost pl-catfilter__btn">
              Göster
            </button>
          </form>

          <div className="pl-sortmode">
            <Link
              href={buildQuery(sp, { sort: undefined, sayfa: undefined })}
              className={"pl-sortmode__btn" + (!reorderable ? " pl-sortmode__btn--on" : "")}
            >
              Son güncellenen
            </Link>
            <Link
              href={buildQuery(sp, { sort: "sira", sayfa: undefined })}
              className={"pl-sortmode__btn" + (reorderable ? " pl-sortmode__btn--on" : "")}
            >
              Sıralama
            </Link>
          </div>
        </div>

        {reorderable && (
          <div className="pl-ordhint">
            Okları kullanarak ürünleri yukarı/aşağı taşıyın. Bu sıra, sitedeki ürünler
            sayfasında “Öne Çıkanlar” sıralamasına yansır.
            {filters.kategori ? " Taşıma seçili kategori içinde yapılır." : ""}
          </div>
        )}

        {/* Tablo */}
        <div className="mv-card mv-card--flush">
          {rows.length === 0 ? (
            <div className="mv-empty">Bu filtreye uygun ürün yok.</div>
          ) : (
            <table className="mv-table pl-table">
              <thead>
                <tr>
                  {reorderable && <th className="pl-ordcol">Sıra</th>}
                  <th className="pl-imgcol" />
                  <th>Ürün</th>
                  <th>Referans</th>
                  <th>Kategori</th>
                  <th>Marka</th>
                  <th>Durum</th>
                  <th>Güncelleme</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id}>
                    {reorderable && (
                      <td className="pl-ordcol">
                        <div className="pl-ord">
                          <form action={moveProductOrder}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="dir" value="up" />
                            {scope.q && <input type="hidden" name="q" value={scope.q} />}
                            {scope.status && (
                              <input type="hidden" name="status" value={scope.status} />
                            )}
                            {scope.kategori && (
                              <input type="hidden" name="kategori" value={scope.kategori} />
                            )}
                            <button
                              type="submit"
                              className="pl-ord__btn"
                              aria-label="Yukarı taşı"
                              disabled={page === 1 && i === 0}
                            >
                              ▲
                            </button>
                          </form>
                          <form action={moveProductOrder}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="dir" value="down" />
                            {scope.q && <input type="hidden" name="q" value={scope.q} />}
                            {scope.status && (
                              <input type="hidden" name="status" value={scope.status} />
                            )}
                            {scope.kategori && (
                              <input type="hidden" name="kategori" value={scope.kategori} />
                            )}
                            <button
                              type="submit"
                              className="pl-ord__btn"
                              aria-label="Aşağı taşı"
                              disabled={page === pageCount && i === rows.length - 1}
                            >
                              ▼
                            </button>
                          </form>
                        </div>
                      </td>
                    )}
                    <td className="pl-imgcol">
                      <Link href={`/admin/products/${p.id}`} className="pl-thumb pl-thumblink">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} width={44} height={44} style={{ objectFit: "cover", width: 44, height: 44 }} />
                        ) : (
                          <span>IMG</span>
                        )}
                      </Link>
                    </td>
                    <td>
                      <div className="pl-name">
                        <Link href={`/admin/products/${p.id}`} className="pl-namelink">
                          {p.name}
                        </Link>
                        {p.isFeatured && <span className="pl-badge">ÖNE ÇIKAN</span>}
                      </div>
                      <div className="pl-sub">
                        {p.oemCount > 0 ? `${p.oemCount} OEM çapraz referans` : "OEM referans yok"}
                      </div>
                    </td>
                    <td>
                      <span className="mv-mono mv-ref">{p.sku}</span>
                    </td>
                    <td className="mv-muted">{p.category}</td>
                    <td>
                      <span className="pl-brand">{p.brand ?? "—"}</span>
                    </td>
                    <td>
                      <span className={"mv-pill mv-pill--" + (p.isActive ? "ok" : "mute")}>
                        {p.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="mv-dim">{p.updatedLabel}</td>
                    <td>
                      <RowActions
                        id={p.id}
                        name={p.name}
                        isActive={p.isActive}
                        isFeatured={p.isFeatured}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Sayfalama */}
          {pageCount > 1 && (
            <div className="pl-pager">
              <div className="pl-pager__info">
                <b>{(page - 1) * 20 + 1}</b>–<b>{Math.min(page * 20, total)}</b> /{" "}
                <b>{nf.format(total)}</b> ürün
              </div>
              <div className="pl-pager__nav">
                <Link
                  className={"pl-pager__btn" + (page <= 1 ? " pl-pager__btn--off" : "")}
                  href={buildQuery(sp, { sayfa: String(Math.max(1, page - 1)) })}
                >
                  ‹
                </Link>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    className={"pl-pager__btn" + (n === page ? " pl-pager__btn--on" : "")}
                    href={buildQuery(sp, { sayfa: String(n) })}
                  >
                    {n}
                  </Link>
                ))}
                <Link
                  className={"pl-pager__btn" + (page >= pageCount ? " pl-pager__btn--off" : "")}
                  href={buildQuery(sp, { sayfa: String(Math.min(pageCount, page + 1)) })}
                >
                  ›
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
