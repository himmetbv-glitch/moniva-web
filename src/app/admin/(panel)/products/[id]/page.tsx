import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEditorOptions, getProductForEdit } from "@/lib/admin/product-editor";
import { getProductImages } from "@/lib/admin/product-images";
import { getProductDatasheets } from "@/lib/admin/product-datasheets";
import { AdminTopbar } from "../../AdminTopbar";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "Ürün Düzenle" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, options, images, datasheets] = await Promise.all([
    getProductForEdit(id),
    getEditorOptions(),
    getProductImages(id),
    getProductDatasheets(id),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminTopbar title="Ürün Düzenle" crumbs={["Moniva Yönetim", "Katalog", "Ürünler"]} />
      <ProductEditor
        mode="edit"
        initial={product}
        options={options}
        images={images}
        datasheets={datasheets}
      />
    </>
  );
}
