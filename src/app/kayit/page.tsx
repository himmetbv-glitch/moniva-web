import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/site/AuthShell";
import { getOptionalUser } from "@/lib/customer/dal";
import { safeNext } from "@/lib/actions/customer-auth-types";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Üye Ol — Moniva",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, sp] = await Promise.all([getOptionalUser(), searchParams]);
  const next = safeNext(sp.next);
  if (user) redirect(next);

  return (
    <AuthShell
      title="B2B hesabı oluştur"
      subtitle="Firma bilgilerinizle üye olun; tekliflerinizi tek panelden yönetin."
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
