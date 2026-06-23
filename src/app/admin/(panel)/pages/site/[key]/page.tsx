import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { verifyAdmin } from "@/lib/admin/dal";
import { getManagedPageForEdit } from "@/lib/admin/managed-pages";
import { getCategoryOptions } from "@/lib/pages/home-content";
import { AdminTopbar } from "../../../AdminTopbar";
import { ManagedPageEditor } from "@/components/admin/ManagedPageEditor";

export const metadata: Metadata = { title: "Sayfa Düzenle" };

export default async function ManagedPageEditPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const [, page, categoryOptions] = await Promise.all([
    verifyAdmin(),
    getManagedPageForEdit(key),
    getCategoryOptions(),
  ]);
  if (!page) notFound();

  return (
    <>
      <AdminTopbar title={`Düzenle — ${page.title}`} crumbs={["Moniva Yönetim", "İçerik", "Sayfalar"]} />
      <ManagedPageEditor initial={page} categoryOptions={categoryOptions} />
    </>
  );
}
