import type { Metadata } from "next";
import Link from "next/link";

import { getAdminBrands } from "@/lib/admin/brands";
import { AdminTopbar } from "../AdminTopbar";
import { Icons } from "../icons";
import { BrandDelete } from "./BrandDelete";

export const metadata: Metadata = { title: "Markalar" };

export default async function AdminBrandsPage() {
  const brands = await getAdminBrands();

  return (
    <>
      <AdminTopbar title="Markalar" crumbs={["Moniva Yönetim", "Katalog"]} />
      <div className="ad-page">
        <div className="ad-welcome">
          <div>
            <h1 className="ad-welcome__hi">Markalar</h1>
            <div className="ad-welcome__sub">Katalogdaki OEM ve aftermarket tedarikçi markaları.</div>
          </div>
          <div className="ad-welcome__actions">
            <Link href="/admin/brands/new" className="ad-btn ad-btn--primary">
              <Icons.plus /> Yeni Marka
            </Link>
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="ad-card ad-empty">Henüz marka yok.</div>
        ) : (
          <div className="br-grid">
            {brands.map((b) => (
              <div className="br-card" key={b.id}>
                <div className="br-card__head" style={{ background: b.color }}>
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt={b.name} />
                  ) : (
                    <span>{b.name}</span>
                  )}
                </div>
                <div className="br-card__body">
                  <div className="br-card__top">
                    <div>
                      <div className="br-card__name">{b.name}</div>
                      <div className="br-card__slug ad-mono">/{b.slug}</div>
                    </div>
                    <span className={"ad-pill ad-pill--" + (b.isActive ? "ok" : "mute")}>
                      {b.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div className="br-card__foot">
                    <div>
                      <span className="br-card__parts">{b.productCount}</span> ürün
                    </div>
                    <div className="br-card__actions">
                      <Link href={`/admin/brands/${b.id}`} className="br-manage">Düzenle ▶</Link>
                      <BrandDelete id={b.id} name={b.name} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
