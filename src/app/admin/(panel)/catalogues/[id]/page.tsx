import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCatalogueForEdit } from "@/lib/admin/catalogues";
import { getCatalogueTypeOptions } from "@/lib/admin/catalogue-types";
import { AdminTopbar } from "../../AdminTopbar";
import { CatalogueEditor } from "@/components/admin/CatalogueEditor";

export const metadata: Metadata = { title: "Katalog Düzenle" };

export default async function EditCataloguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cat, types] = await Promise.all([getCatalogueForEdit(id), getCatalogueTypeOptions()]);
  if (!cat) notFound();

  return (
    <>
      <AdminTopbar title="Katalog Düzenle" crumbs={["Moniva Yönetim", "İçerik", "Kataloglar"]} />
      <CatalogueEditor mode="edit" initial={cat} types={types} />
    </>
  );
}
