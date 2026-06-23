import type { Metadata } from "next";

import { blankEditorBrand } from "@/lib/admin/brands";
import { AdminTopbar } from "../../AdminTopbar";
import { BrandEditor } from "@/components/admin/BrandEditor";

export const metadata: Metadata = { title: "Yeni Marka" };

export default function NewBrandPage() {
  return (
    <>
      <AdminTopbar title="Yeni Marka" crumbs={["Moniva Yönetim", "Katalog", "Markalar"]} />
      <BrandEditor mode="new" initial={blankEditorBrand()} />
    </>
  );
}
