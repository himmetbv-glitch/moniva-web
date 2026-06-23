"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { CartView, CartLine, QuotePrefill } from "@/lib/actions/quote-types";
import {
  clearCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/actions/quote";
import { QuoteFormModal } from "./QuoteFormModal";
import {
  ArrowIcon,
  BoxIcon,
  GearIllust,
  SendIcon,
  ShieldIcon,
  TrashIcon,
} from "./icons";

export function QuoteCart({
  cart,
  prefill,
}: {
  cart: CartView;
  prefill: QuotePrefill | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch {
        setError("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
      }
    });

  const updateQty = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    run(() => updateCartItemQuantity(productId, quantity));
  };
  const remove = (productId: string) => run(() => removeCartItem(productId));
  const clear = () => run(() => clearCart());

  return (
    <>
      {error && (
        <div className="cart-error" role="alert">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ width: 16, height: 16, flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}
      <div className="s2-body" data-pending={isPending}>
        <div className="s2-list">
        <div className="lhead">
          <span />
          <span>Ürün</span>
          <span>Adet</span>
          <span />
        </div>

        {cart.lines.map((line) => (
          <CartRow
            key={line.itemId}
            line={line}
            disabled={isPending}
            onQty={updateQty}
            onRemove={remove}
          />
        ))}

        <div className="lfoot">
          <Link className="cont" href="/urunler">
            ← Alışverişe Devam Et
          </Link>
          <button className="clear" onClick={clear} disabled={isPending}>
            Listeyi temizle
          </button>
        </div>
      </div>

      <aside className="s2-sum">
        <div className="head">
          <h3>Sepet Özeti</h3>
          <p>Liste içeriği — teklif gönderildiğinde donar.</p>
        </div>
        <div className="stats">
          <div className="row">
            <span className="label">Toplam Ürün</span>
            <span className="val">
              <b>{cart.totalQuantity}</b> adet
            </span>
          </div>
          <div className="row">
            <span className="label">Toplam Çeşit</span>
            <span className="val">
              <b>{cart.lineCount}</b> kalem
            </span>
          </div>
          <div className="row">
            <span className="label">OEM / Aftermarket</span>
            <span className="val">
              {cart.oemCount} / {cart.aftermarketCount}
            </span>
          </div>
        </div>

        <div className="cta-wrap">
          <button
            className="btn-quote"
            onClick={() => setModalOpen(true)}
            disabled={isPending}
          >
            <SendIcon />
            Teklif Al
          </button>
          <p className="promise">
            <b>✓</b> 24 saat içinde size dönüş yapacağız.
          </p>
        </div>

        <div className="trust">
          <div className="t">
            <ShieldIcon />
            <b>Güvenli</b>KVKK uyumlu
          </div>
          <div className="t">
            <BoxIcon />
            <b>OEM</b>Garantili
          </div>
          <div className="t">
            <ArrowIcon />
            <b>24h</b>Dönüş
          </div>
        </div>
      </aside>

      {modalOpen && (
        <QuoteFormModal
          totalQuantity={cart.totalQuantity}
          lineCount={cart.lineCount}
          prefill={prefill}
          onClose={() => setModalOpen(false)}
        />
      )}
      </div>
    </>
  );
}

function CartRow({
  line,
  disabled,
  onQty,
  onRemove,
}: {
  line: CartLine;
  disabled: boolean;
  onQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const [draft, setDraft] = useState(String(line.quantity));

  const commit = (value: string) => {
    const n = Math.max(1, Math.min(9999, Math.floor(Number(value) || 1)));
    setDraft(String(n));
    if (n !== line.quantity) onQty(line.productId, n);
  };

  return (
    <div className="lrow">
      <div className="pimg">
        {line.imageUrl ? (
          <img src={line.imageUrl} alt={line.name} />
        ) : (
          <GearIllust className="illust" />
        )}
      </div>

      <div className="pinfo">
        {line.category && <div className="cat">{line.category}</div>}
        <div className="pn">{line.name}</div>
        <div className="poem">
          {line.oemNumbers.length > 0 && (
            <>
              <b>OEM:</b> {line.oemNumbers.join(" · ")} ·{" "}
            </>
          )}
          <b>SKU:</b> {line.sku}
        </div>
        <div className="meta-chips">
          <span className={`chip${line.partType === "AFTERMARKET" ? " am" : ""}`}>
            {line.partType === "OEM" ? "OEM Original" : "Aftermarket"}
          </span>
        </div>
      </div>

      <div className="qty">
        <button
          type="button"
          onClick={() => commit(String(line.quantity - 1))}
          disabled={disabled || line.quantity <= 1}
          aria-label="Azalt"
        >
          −
        </button>
        <input
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="Adet"
        />
        <button
          type="button"
          onClick={() => commit(String(line.quantity + 1))}
          disabled={disabled}
          aria-label="Artır"
        >
          +
        </button>
      </div>

      <button
        className="del"
        onClick={() => onRemove(line.productId)}
        disabled={disabled}
        aria-label="Listeden çıkar"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
