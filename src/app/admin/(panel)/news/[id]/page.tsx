import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNewsForEdit } from "@/lib/admin/news";
import { AdminTopbar } from "../../AdminTopbar";
import { NewsEditor } from "@/components/admin/NewsEditor";

export const metadata: Metadata = { title: "Haber Düzenle" };

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getNewsForEdit(id);
  if (!post) notFound();

  return (
    <>
      <AdminTopbar title="Haber Düzenle" crumbs={["Moniva Yönetim", "İçerik", "Newsroom"]} />
      <NewsEditor mode="edit" initial={post} />
    </>
  );
}
