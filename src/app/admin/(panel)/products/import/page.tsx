import type { Metadata } from "next";

import { getImportLookups } from "@/lib/admin/import-options";
import { AdminTopbar } from "../../AdminTopbar";
import { ProductImport } from "@/components/admin/ProductImport";

export const metadata: Metadata = { title: "Toplu Import" };

export default async function ProductImportPage() {
  const { categoryByKey, brandByName, categoryLabels } = await getImportLookups();
  return (
    <>
      <AdminTopbar title="Toplu Import" crumbs={["Moniva Yönetim", "Katalog", "Ürünler"]} />
      <ProductImport
        lookups={{ categoryByKey, brandByName }}
        categoryLabels={categoryLabels}
      />
    </>
  );
}
