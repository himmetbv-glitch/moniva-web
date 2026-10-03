import type { Metadata } from "next";

import { loadSettings } from "@/lib/settings";
import { AdminTopbar } from "../AdminTopbar";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const settings = await loadSettings();
  return (
    <>
      <AdminTopbar title="Ayarlar" crumbs={["Moniva Yönetim", "Sistem"]} />
      <SettingsForm initial={settings} />
    </>
  );
}
