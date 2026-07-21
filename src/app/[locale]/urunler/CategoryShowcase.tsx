import Link from "next/link";

import type { ShowcaseCategory } from "@/lib/products/queries";

export function CategoryShowcase({
  categories,
  total,
}: {
  categories: ShowcaseCategory[];
  total: number;
}) {
  return (
    <div className="cat-showcase">
      <div className="csc-head">
        <h2 className="csc-title">Kategoriler</h2>
        <p className="csc-sub">Ürünleri görüntülemek için bir kategori seçin.</p>
      </div>

      <div className="csc-grid">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`?kategori=${encodeURIComponent(c.slug)}`}
            className="csc-card"
          >
            <div className="csc-thumb">
              {c.image ? (
                <img src={c.image} alt={c.name} />
              ) : (
                <span className="csc-ph">{c.name}</span>
              )}
            </div>
            <div className="csc-body">
              <span className="csc-name">{c.name}</span>
              <span className="csc-count">
                {c.count.toLocaleString("tr-TR")} ürün
              </span>
            </div>
          </Link>
        ))}

        <Link href="?tum=1" className="csc-card csc-all">
          <div className="csc-thumb">
            <span className="csc-all-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
          </div>
          <div className="csc-body">
            <span className="csc-name">Tüm Ürünler</span>
            <span className="csc-count">
              {total.toLocaleString("tr-TR")} ürün
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
