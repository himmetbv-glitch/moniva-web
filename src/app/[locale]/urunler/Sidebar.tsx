"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { BrandFilter, CategoryNode } from "@/lib/products/queries";
import { patchQuery } from "@/lib/products/filter-url";
import { QMODES, type QMode } from "@/lib/validation/product-filters";

const Check = () => (
  <svg viewBox="0 0 9 7" fill="none">
    <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Sidebar({
  tree,
  brands,
  activeCategory,
  activeBrands,
}: {
  tree: CategoryNode[];
  brands: BrandFilter[];
  activeCategory?: string;
  activeBrands: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();
  const t = useTranslations();

  const initialOpen =
    tree.find(
      (r) =>
        r.slug === activeCategory ||
        r.children.some((c) => c.slug === activeCategory),
    )?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(initialOpen);

  const spMode = sp.get("qmod");
  const initialMode: QMode = QMODES.includes(spMode as QMode)
    ? (spMode as QMode)
    : "tumu";
  const [mode, setMode] = useState<QMode>(initialMode);
  const [term, setTerm] = useState(sp.get("q") ?? "");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = term.trim();
    router.push(
      pathname +
        patchQuery(qs, {
          q: v || null,
          qmod: v && mode !== "tumu" ? mode : null,
          sayfa: null,
        }),
    );
  };

  const catHref = (slug: string) =>
    patchQuery(qs, { kategori: slug, sayfa: null });

  const openAndFilter = (id: string, slug: string) => {
    setOpenId(id);
    router.push(pathname + catHref(slug));
  };

  const toggleBrand = (slug: string) => {
    const next = activeBrands.includes(slug)
      ? activeBrands.filter((b) => b !== slug)
      : [...activeBrands, slug];
    router.push(pathname + patchQuery(qs, { marka: next, sayfa: null }));
  };

  const hasFilters = !!activeCategory || activeBrands.length > 0;

  return (
    <aside className="sidebar">
      <form className="prod-search" onSubmit={submitSearch}>
        <select
          className="ps-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as QMode)}
          aria-label={t("product.search.scopeAria")}
        >
          {QMODES.map((m) => (
            <option key={m} value={m}>
              {t(`product.search.modes.${m}`)}
            </option>
          ))}
        </select>
        <input
          className="ps-input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t(`product.search.placeholders.${mode}`)}
          aria-label={t("product.search.inputAria")}
        />
        <button className="ps-btn" type="submit">
          {t("product.search.submit")}
        </button>
      </form>

      <div className="cat-menu">
        <div className="cat-menu-head">{t("product.categoryMenu.heading")}</div>
        <div className="rule" />

        <div className="cat-list">
          {tree.map((root) => {
            const hasChildren = root.children.length > 0;
            const open = openId === root.id;
            const isActive = activeCategory === root.slug;
            return (
              <div
                key={root.id}
                className={`cat-row${isActive ? " active" : ""}${open ? " open" : ""}`}
              >
                {hasChildren ? (
                  <div
                    className="cat-row-head"
                    role="button"
                    tabIndex={0}
                    onClick={() => openAndFilter(root.id, root.slug)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openAndFilter(root.id, root.slug);
                      }
                    }}
                  >
                    <span className="cat-label">{root.name}</span>
                    <span className="cat-count">{root.count}</span>
                    <span
                      className="cat-toggle"
                      role="button"
                      tabIndex={0}
                      aria-label={
                        open
                          ? t("product.categoryMenu.collapse")
                          : t("product.categoryMenu.expand")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(open ? null : root.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenId(open ? null : root.id);
                        }
                      }}
                    >
                      {open ? "−" : "+"}
                    </span>
                  </div>
                ) : (
                  <Link className="cat-row-head" href={catHref(root.slug)}>
                    <span className="cat-label">{root.name}</span>
                    <span className="cat-count">{root.count}</span>
                    <span className="cat-toggle">›</span>
                  </Link>
                )}

                {hasChildren && open && (
                  <div className="cat-children">
                    {root.children.map((child) => (
                      <Link
                        key={child.id}
                        href={catHref(child.slug)}
                        className={`cat-child${activeCategory === child.slug ? " active" : ""}`}
                      >
                        <span className="branch" />
                        <span className="cc-label">{child.name}</span>
                        <span className="cc-count">{child.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="filters-head">
        <span className="ft">{t("product.filters.heading")}</span>
        {hasFilters && (
          <Link className="clear-all" href="/urunler">
            {t("product.filters.clearAll")}
          </Link>
        )}
      </div>

      {brands.length > 0 && (
        <div className="filter-group">
          <div className="fg-title">{t("product.filters.brandHeading")}</div>
          {brands.map((b) => {
            const on = activeBrands.includes(b.slug);
            return (
              <div
                key={b.slug}
                className={`check-row${on ? " on" : ""}`}
                onClick={() => toggleBrand(b.slug)}
              >
                <span className="cr-left">
                  <span className="check-box">
                    <Check />
                  </span>
                  <span className="check-label">{b.name}</span>
                </span>
                <span className="check-count">{b.count}</span>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
