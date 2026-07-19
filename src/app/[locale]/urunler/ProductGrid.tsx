"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { ProductListResult } from "@/lib/products/queries";
import type { CatalogCardData } from "@/lib/pages/catalog-sections";
import {
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
  const t = useTranslations();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen] = useState(false);
  const [jumpIdx, setJumpIdx] = useState<number | null>(null);
  const [jumpVal, setJumpVal] = useState("");

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
      <div className="toolbar">
        <div className="tb-count">
          <b>{start}</b>–<b>{end}</b> / <b>{total.toLocaleString("tr-TR")}</b>{" "}
          {t("product.grid.countSuffix")}
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

          <div className="sort">
            <button className="sort-btn" onClick={() => setSortOpen((o) => !o)}>
              <span className="lbl">{t("product.grid.sortLabel")}</span>
              <b>{t(`product.grid.sorts.${filters.sirala}`)}</b>
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
                    {t(`product.grid.sorts.${v}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn${view === "grid" ? " active" : ""}`}
              onClick={() => setView("grid")}
              aria-label={t("product.grid.viewGrid")}
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
              aria-label={t("product.grid.viewList")}
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

      {items.length === 0 ? (
        <div className="pgrid-empty">
          {filters.q
            ? t("product.grid.emptyWithQuery", { query: filters.q })
            : t("product.grid.emptyNoQuery")}
        </div>
      ) : (
        <div className={`pgrid${view === "list" ? " list" : ""}`}>
          {items.map((p) => (
            <ProductCard key={p.id} p={p} labels={card} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <div className="pg-info">
            {t.rich("product.grid.pageInfo", {
              page,
              total: totalPages,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </div>
          <div className="pg-btns">
            {page > 1 ? (
              <Link href={pathname + patchQuery(qs, { sayfa: String(page - 1) })}>‹</Link>
            ) : (
              <span className="disabled">‹</span>
            )}
            {pages.map((n, i) =>
              n === "…" ? (
                jumpIdx === i ? (
                  <form
                    key={`e${i}`}
                    className="pg-jump"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const num = Math.min(
                        Math.max(1, Math.floor(Number(jumpVal)) || 1),
                        totalPages,
                      );
                      setJumpIdx(null);
                      setJumpVal("");
                      if (num !== page) go({ sayfa: String(num) });
                    }}
                  >
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={jumpVal}
                      autoFocus
                      placeholder={t("product.grid.jumpPlaceholder")}
                      aria-label={t("product.grid.jumpAria")}
                      onChange={(e) => setJumpVal(e.target.value)}
                      onBlur={() => setJumpIdx(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setJumpIdx(null);
                      }}
                    />
                  </form>
                ) : (
                  <button
                    key={`e${i}`}
                    type="button"
                    className="pg-more"
                    title={t("product.grid.jumpTitle")}
                    aria-label={t("product.grid.jumpTitle")}
                    onClick={() => {
                      setJumpVal("");
                      setJumpIdx(i);
                    }}
                  >
                    …
                  </button>
                )
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
