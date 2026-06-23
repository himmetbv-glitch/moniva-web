import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/site/AuthShell";
import { getOptionalUser } from "@/lib/customer/dal";
import { safeNext } from "@/lib/actions/customer-auth-types";
import { CustomerLoginForm } from "./CustomerLoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap — Moniva",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, sp] = await Promise.all([getOptionalUser(), searchParams]);
  const next = safeNext(sp.next);
  if (user) redirect(next);

  return (
    <AuthShell
      title="Giriş yap"
      subtitle="B2B hesabınızla giriş yapın; tekliflerinizi panelinizden takip edin."
    >
      <CustomerLoginForm next={next} />
    </AuthShell>
  );
}
