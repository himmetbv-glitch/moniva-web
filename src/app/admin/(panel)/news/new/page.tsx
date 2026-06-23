import type { Metadata } from "next";

import { blankEditorNews } from "@/lib/admin/news";
import { AdminTopbar } from "../../AdminTopbar";
import { NewsEditor } from "@/components/admin/NewsEditor";

export const metadata: Metadata = { title: "Yeni Haber" };

export default function NewNewsPage() {
  return (
    <>
      <AdminTopbar title="Yeni Haber" crumbs={["Moniva Yönetim", "İçerik", "Newsroom"]} />
      <NewsEditor mode="new" initial={blankEditorNews()} />
    </>
  );
}
