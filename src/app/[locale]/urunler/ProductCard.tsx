"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/actions/quote";
import { isSyntheticSku } from "@/lib/products/sku";
import type { ProductCardView } from "@/lib/products/queries";
import type { CatalogCardData } from "@/lib/pages/catalog-sections";

export function ProductCard({ p, labels }: { p: ProductCardView; labels: CatalogCardData }) {
  const router = useRouter();
  const t = useTranslations();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, start] = useTransition();

  const bump = (d: number) => setQty((q) => Math.max(1, Math.min(999, q + d)));

  const add = () =>
    start(async () => {
      try {
        await addToCart(p.id, qty);
        setAdded(true);
        router.refresh(); // header sepet sayacını tazele
        setTimeout(() => setAdded(false), 1500);
      } catch {
        // sessizce geç — kart bazlı hata göstermiyoruz (liste düzeyi 2d)
      }
    });

  return (
    <div className="pcard">
      {p.partType === "OEM" ? (
        <div className="badge oem">{t("product.badges.oem")}</div>
      ) : p.isFeatured ? (
        <div className="badge featured">{t("product.badges.featured")}</div>
      ) : null}

      <Link className="pc-img" href={`/urunler/${p.slug}`}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} />
        ) : (
          <>
            <span className="ph" />
            <span className="ph-label">{p.category ?? "MONIVA"}</span>
          </>
        )}
      </Link>

      <div className="pc-body">
        <div className="pc-main">
          {p.category && <div className="pc-cat">{p.category}</div>}
          <Link className="pc-name" href={`/urunler/${p.slug}`}>
            {p.name}
          </Link>
          {!isSyntheticSku(p.sku) && (
            <div className="pc-ref">
              <b>{t("product.card.refLabel")}</b> {p.sku}
            </div>
          )}
          {p.oemNumbers.length > 0 && (
            <div className="pc-oem">
              {t("product.card.oemLabel")} {p.oemNumbers.slice(0, 3).join(" · ")}
              {p.oemNumbers.length > 3 ? " …" : ""}
            </div>
          )}
          <div className="pc-quote">
            <span className="dot" />
            <span>{labels.quoteText}</span>
          </div>
        </div>

        <div className="pc-action">
          <div className="pc-qty">
            <button
              type="button"
              onClick={() => bump(-1)}
              disabled={qty <= 1}
              aria-label={t("product.card.qtyDecrease")}
            >
              −
            </button>
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))
              }
              aria-label={t("product.card.qty")}
            />
            <button
              type="button"
              onClick={() => bump(1)}
              aria-label={t("product.card.qtyIncrease")}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className={`pc-add${added ? " added" : ""}`}
            onClick={add}
            disabled={pending}
          >
            {added ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12 L10 17 L20 7" />
                </svg>
                {labels.addedLabel}
              </>
            ) : (
              labels.addLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
