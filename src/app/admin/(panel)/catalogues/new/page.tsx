import type { Metadata } from "next";

import { blankEditorCatalogue } from "@/lib/admin/catalogues";
import { getCatalogueTypeOptions } from "@/lib/admin/catalogue-types";
import { AdminTopbar } from "../../AdminTopbar";
import { CatalogueEditor } from "@/components/admin/CatalogueEditor";

export const metadata: Metadata = { title: "Yeni Katalog" };

export default async function NewCataloguePage() {
  const types = await getCatalogueTypeOptions();
  return (
    <>
      <AdminTopbar title="Yeni Katalog" crumbs={["Moniva Yönetim", "İçerik", "Kataloglar"]} />
      <CatalogueEditor mode="new" initial={blankEditorCatalogue()} types={types} />
    </>
  );
}
