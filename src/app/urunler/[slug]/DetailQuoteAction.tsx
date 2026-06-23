"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addToCart } from "@/lib/actions/quote";

export function DetailQuoteAction({
  productId,
  addLabel,
  addedLabel,
}: {
  productId: string;
  addLabel: string;
  addedLabel: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, start] = useTransition();

  const bump = (d: number) => setQty((q) => Math.max(1, Math.min(999, q + d)));

  const add = () =>
    start(async () => {
      try {
        await addToCart(productId, qty);
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 1600);
      } catch {
        /* sessizce geç */
      }
    });

  return (
    <div className="pd-qaction">
      <div className="pd-qty">
        <button type="button" onClick={() => bump(-1)} disabled={qty <= 1} aria-label="Azalt">
          −
        </button>
        <input
          inputMode="numeric"
          value={qty}
          onChange={(e) =>
            setQty(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))
          }
          aria-label="Adet"
        />
        <button type="button" onClick={() => bump(1)} aria-label="Artır">
          +
        </button>
      </div>
      <button
        type="button"
        className={`pd-add${added ? " added" : ""}`}
        onClick={add}
        disabled={pending}
      >
        {added ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12 L10 17 L20 7" />
            </svg>
            {addedLabel}
          </>
        ) : (
          addLabel
        )}
      </button>
    </div>
  );
}
