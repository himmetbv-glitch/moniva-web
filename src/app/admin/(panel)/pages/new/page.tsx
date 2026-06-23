import type { Metadata } from "next";

import { blankEditorPage } from "@/lib/admin/pages";
import { AdminTopbar } from "../../AdminTopbar";
import { PageEditor } from "@/components/admin/PageEditor";

export const metadata: Metadata = { title: "Yeni Sayfa" };

export default function NewPagePage() {
  return (
    <>
      <AdminTopbar title="Yeni Sayfa" crumbs={["Moniva Yönetim", "İçerik", "Sayfalar"]} />
      <PageEditor mode="new" initial={blankEditorPage()} />
    </>
  );
}
