import type { Metadata } from "next";

import {
  blankEditorCategory,
  getCategoryParentOptions,
  getCategorySchemaSources,
} from "@/lib/admin/categories";
import { AdminTopbar } from "../../AdminTopbar";
import { CategoryEditor } from "@/components/admin/CategoryEditor";

export const metadata: Metadata = { title: "Yeni Kategori" };

export default async function NewCategoryPage() {
  const [parents, sources] = await Promise.all([
    getCategoryParentOptions(),
    getCategorySchemaSources(),
  ]);
  return (
    <>
      <AdminTopbar title="Yeni Kategori" crumbs={["Moniva Yönetim", "Katalog", "Kategoriler"]} />
      <CategoryEditor mode="new" initial={blankEditorCategory()} parents={parents} sources={sources} />
    </>
  );
}
