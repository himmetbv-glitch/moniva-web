import type { Metadata } from "next";

import { verifyAdmin } from "@/lib/admin/dal";
import { AdminTopbar } from "../../AdminTopbar";
import { NewUserForm } from "@/components/admin/NewUserForm";

export const metadata: Metadata = { title: "Yeni Kullanıcı" };

export default async function NewUserPage() {
  await verifyAdmin();
  return (
    <>
      <AdminTopbar title="Yeni Kullanıcı" crumbs={["Moniva Yönetim", "Sistem"]} />
      <NewUserForm />
    </>
  );
}
