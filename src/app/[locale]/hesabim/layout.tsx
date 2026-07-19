import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { requireUser } from "@/lib/customer/dal";
import "./account.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: t("layoutTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser("/hesabim");

  return (
    <div className="account-page">
      <SiteHeader />
      <div className="ac-wrap">{children}</div>
      <SiteFooter />
    </div>
  );
}
