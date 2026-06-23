import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { requireUser } from "@/lib/customer/dal";
import "./account.css";

export const metadata: Metadata = {
  title: "Hesabım — Moniva",
  robots: { index: false, follow: false },
};

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
