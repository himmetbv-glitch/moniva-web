import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBrandForEdit } from "@/lib/admin/brands";
import { AdminTopbar } from "../../AdminTopbar";
import { BrandEditor } from "@/components/admin/BrandEditor";

export const metadata: Metadata = { title: "Marka Düzenle" };

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getBrandForEdit(id);
  if (!brand) notFound();

  return (
    <>
      <AdminTopbar title="Marka Düzenle" crumbs={["Moniva Yönetim", "Katalog", "Markalar"]} />
      <BrandEditor mode="edit" initial={brand} />
    </>
  );
}
