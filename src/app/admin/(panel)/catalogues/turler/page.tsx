import type { Metadata } from "next";
import Link from "next/link";

import { getAdminCatalogueTypes } from "@/lib/admin/catalogue-types";
import { AdminTopbar } from "../../AdminTopbar";
import { CatalogueTypeManager } from "@/components/admin/CatalogueTypeManager";

export const metadata: Metadata = { title: "Katalog Türleri" };

export default async function CatalogueTypesPage() {
  const types = await getAdminCatalogueTypes();

  return (
    <>
      <AdminTopbar title="Katalog Türleri" crumbs={["Moniva Yönetim", "İçerik", "Kataloglar"]} />
      <div className="mv-page">
        <div className="iq-head">
          <div>
            <div className="iq-head__crumb">
              <Link href="/admin/catalogues">KATALOGLAR</Link> / TÜRLER
            </div>
            <div className="iq-head__title">
              <span>Katalog Türleri</span>
            </div>
            <div className="iq-head__meta" style={{ marginTop: -6 }}>
              Katalog tiplerini buradan yönetin — ekleyin, yeniden adlandırın, renk ve sıra
              belirleyin. Bir türde katalog varsa silinemez.
            </div>
          </div>
          <div className="iq-head__actions">
            <Link href="/admin/catalogues" className="mv-btn mv-btn--ghost">← Kataloglar</Link>
          </div>
        </div>

        <CatalogueTypeManager types={types} />
      </div>
    </>
  );
}
