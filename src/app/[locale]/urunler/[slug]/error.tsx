"use client";

import { useEffect } from "react";

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="boundary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <h2>Ürün yüklenemedi</h2>
      <p>Bu ürün yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.</p>
      <button onClick={reset}>Tekrar Dene</button>
    </div>
  );
}
