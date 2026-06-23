import type { Metadata } from "next";

import { getEditorOptions, blankEditorProduct } from "@/lib/admin/product-editor";
import { AdminTopbar } from "../../AdminTopbar";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "Yeni Ürün" };

export default async function NewProductPage() {
  const options = await getEditorOptions();
  return (
    <>
      <AdminTopbar title="Yeni Ürün" crumbs={["Moniva Yönetim", "Katalog", "Ürünler"]} />
      <ProductEditor mode="new" initial={blankEditorProduct()} options={options} />
    </>
  );
}
