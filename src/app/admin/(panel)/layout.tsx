import type { Metadata } from "next";

import { verifyAdmin } from "@/lib/admin/dal";
import { getAdminSidebarCounts } from "@/lib/admin/dashboard";
import { AdminSidebar } from "./AdminSidebar";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Yönetim — Moniva", template: "%s — Moniva Yönetim" },
  robots: { index: false, follow: false },
};

function initialsOf(name: string, email: string): string {
  const base = name?.trim() || email;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await verifyAdmin();
  const counts = await getAdminSidebarCounts();

  const name = admin.name ?? admin.email ?? "Yönetici";
  const initials = initialsOf(admin.name ?? "", admin.email ?? "");

  return (
    <div className="mv-shell">
      <AdminSidebar name={name} initials={initials} counts={counts} />
      <div className="mv-main">{children}</div>
    </div>
  );
}
