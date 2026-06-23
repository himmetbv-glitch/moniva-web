import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getCategoryForEdit,
  getCategoryParentOptions,
  getCategorySchemaSources,
} from "@/lib/admin/categories";
import { AdminTopbar } from "../../AdminTopbar";
import { CategoryEditor } from "@/components/admin/CategoryEditor";

export const metadata: Metadata = { title: "Kategori Düzenle" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, parents, sources] = await Promise.all([
    getCategoryForEdit(id),
    getCategoryParentOptions(id),
    getCategorySchemaSources(id),
  ]);
  if (!category) notFound();

  return (
    <>
      <AdminTopbar title="Kategori Düzenle" crumbs={["Moniva Yönetim", "Katalog", "Kategoriler"]} />
      <CategoryEditor mode="edit" initial={category} parents={parents} sources={sources} />
    </>
  );
}
