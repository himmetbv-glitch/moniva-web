"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { SETTINGS_ID } from "@/lib/settings";
import { settingsSchema, type SettingsPayload } from "@/lib/validation/admin-settings";

export type SettingsResult = { ok: true } | { ok: false; error: string };

export async function updateSettings(
  raw: SettingsPayload,
): Promise<SettingsResult> {
  await verifyAdmin();

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  const data = {
    companyName: d.companyName,
    addressLine: d.addressLine,
    phone: d.phone,
    email: d.email,
    whatsapp: d.whatsapp || null,
    linkedinUrl: d.linkedinUrl || null,
    xUrl: d.xUrl || null,
    youtubeUrl: d.youtubeUrl || null,
    instagramUrl: d.instagramUrl || null,
    metaTitleBase: d.metaTitleBase,
    metaDescBase: d.metaDescBase || null,
    notifyEmail: d.notifyEmail || null,
    careerPositions: d.careerPositions,
  };

  await prisma.siteSetting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout"); // footer + iletişim
  return { ok: true };
}
