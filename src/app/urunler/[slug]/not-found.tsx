import Link from "next/link";

import "./detail.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function ProductNotFound() {
  return (
    <>
      <SiteHeader />
      <div className="boundary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: "#7e6dc2" }}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <h2>Ürün bulunamadı</h2>
        <p>
          Aradığınız ürün kaldırılmış ya da adresi değişmiş olabilir. Katalogdan
          benzer ürünleri inceleyebilirsiniz.
        </p>
        <Link
          href="/urunler"
          style={{
            display: "inline-block",
            background: "#4f3d8c",
            color: "#fff",
            padding: "12px 28px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          Ürünlere Dön
        </Link>
      </div>
      <SiteFooter />
    </>
  );
}
