"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ProductListResult } from "@/lib/products/queries";
import type { CatalogCardData } from "@/lib/pages/catalog-sections";
import {
  SORT_LABELS,
  SORT_VALUES,
  type ProductFilters,
} from "@/lib/validation/product-filters";
import { patchQuery } from "@/lib/products/filter-url";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  result,
  filters,
  categoryLabel,
  brandLabels,
  card,
}: {
  result: ProductListResult;
  filters: ProductFilters;
  categoryLabel?: string;
  brandLabels: Record<string, string>;
  card: CatalogCardData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen] = useState(false);

  const { items, total, page, perPage, totalPages } = result;
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const go = (patch: Record<string, string | string[] | null>) =>
    router.push(pathname + patchQuery(qs, patch));

  const removeBrand = (slug: string) =>
    filters.marka.filter((b) => b !== slug);

  const pages = pageWindow(page, totalPages);

  return (
    <div className="grid-wrap">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="tb-count">
          <b>{start}</b>–<b>{end}</b> / <b>{total.toLocaleString("tr-TR")}</b> parça
        </div>

        <div className="tb-right">
          {(categoryLabel || filters.marka.length > 0 || filters.q) && (
            <div className="chips">
              {filters.q && (
                <Link
                  className="chip"
                  href={pathname + patchQuery(qs, { q: null, sayfa: null })}
                >
                  “{filters.q}”<span className="x">×</span>
                </Link>
              )}
              {categoryLabel && (
                <Link className="chip" href={pathname + patchQuery(qs, { kategori: null, sayfa: null })}>
                  {categoryLabel}
                  <span className="x">×</span>
                </Link>
              )}
              {filters.marka.map((slug) => (
                <Link
                  key={slug}
                  className="chip"
                  href={pathname + patchQuery(qs, { marka: removeBrand(slug), sayfa: null })}
                >
                  {brandLabels[slug] ?? slug}
                  <span className="x">×</span>
                </Link>
              ))}
            </div>
          )}

          {/* Sort */}
          <div className="sort">
            <button className="sort-btn" onClick={() => setSortOpen((o) => !o)}>
              <span className="lbl">Sırala:</span>
              <b>{SORT_LABELS[filters.sirala]}</b>
              <span style={{ fontSize: 9, color: "#4f3d8c" }}>▼</span>
            </button>
            {sortOpen && (
              <div className="sort-menu">
                {SORT_VALUES.map((v) => (
                  <button
                    key={v}
                    className={v === filters.sirala ? "active" : ""}
                    onClick={() => {
                      setSortOpen(false);
                      go({ sirala: v, sayfa: null });
                    }}
                  >
                    {SORT_LABELS[v]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn${view === "grid" ? " active" : ""}`}
              onClick={() => setView("grid")}
              aria-label="Izgara görünüm"
            >
              <svg viewBox="0 0 12 12" fill="none">
                <rect x="0.5" y="0.5" width="4.5" height="4.5" stroke="currentColor" />
                <rect x="7" y="0.5" width="4.5" height="4.5" stroke="currentColor" />
                <rect x="0.5" y="7" width="4.5" height="4.5" stroke="currentColor" />
                <rect x="7" y="7" width="4.5" height="4.5" stroke="currentColor" />
              </svg>
            </button>
            <button
              className={`view-btn${view === "list" ? " active" : ""}`}
              onClick={() => setView("list")}
              aria-label="Liste görünüm"
            >
              <svg viewBox="0 0 14 12" fill="none">
                <line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid / empty */}
      {items.length === 0 ? (
        <div className="pgrid-empty">
          {filters.q ? (
            <>
              “<b>{filters.q}</b>” ile eşleşen ürün bulunamadı. Farklı bir parça
              adı, SKU veya OEM numarası deneyin.
            </>
          ) : (
            <>
              Bu filtrelerle eşleşen ürün yok. <b>Filtreleri temizleyin</b> veya
              farklı bir kategori seçin.
            </>
          )}
        </div>
      ) : (
        <div className={`pgrid${view === "list" ? " list" : ""}`}>
          {items.map((p) => (
            <ProductCard key={p.id} p={p} labels={card} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pg-info">
            Sayfa <b>{page}</b> / <b>{totalPages}</b>
          </div>
          <div className="pg-btns">
            {page > 1 ? (
              <Link href={pathname + patchQuery(qs, { sayfa: String(page - 1) })}>‹</Link>
            ) : (
              <span className="disabled">‹</span>
            )}
            {pages.map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="disabled">
                  …
                </span>
              ) : (
                <Link
                  key={n}
                  href={pathname + patchQuery(qs, { sayfa: String(n) })}
                  className={n === page ? "active" : ""}
                >
                  {n}
                </Link>
              ),
            )}
            {page < totalPages ? (
              <Link href={pathname + patchQuery(qs, { sayfa: String(page + 1) })}>›</Link>
            ) : (
              <span className="disabled">›</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(total - 1, page + 1);
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < total - 1) out.push("…");
  out.push(total);
  return out;
}
