import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPageForEdit } from "@/lib/admin/pages";
import { AdminTopbar } from "../../AdminTopbar";
import { PageEditor } from "@/components/admin/PageEditor";

export const metadata: Metadata = { title: "Sayfa Düzenle" };

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPageForEdit(id);
  if (!page) notFound();

  return (
    <>
      <AdminTopbar title="Sayfa Düzenle" crumbs={["Moniva Yönetim", "İçerik", "Sayfalar"]} />
      <PageEditor mode="edit" initial={page} />
    </>
  );
}
