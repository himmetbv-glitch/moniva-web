import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/site/AuthShell";
import { getOptionalUser } from "@/lib/customer/dal";
import { safeNext } from "@/lib/actions/customer-auth-types";
import { CustomerLoginForm } from "./CustomerLoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return {
    title: t("pageTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, sp, t] = await Promise.all([
    getOptionalUser(),
    searchParams,
    getTranslations(),
  ]);
  const next = safeNext(sp.next);
  if (user) redirect(next);

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
    >
      <CustomerLoginForm next={next} />
    </AuthShell>
  );
}
