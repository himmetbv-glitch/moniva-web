"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SiteSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/urunler?q=${encodeURIComponent(q)}` : "/urunler");
  };

  return (
    <form className="sh-search" onSubmit={submit} role="search">
      <span className="sh-search__field">
        <svg viewBox="0 0 18 18" fill="none">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Parça, marka, OEM ara…"
          aria-label="Ara"
        />
      </span>
      <button type="submit" className="sh-search__btn">
        Bul
      </button>
    </form>
  );
}
