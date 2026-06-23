import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/admin/settings-types";

const SETTINGS_ID = "singleton";

// Tek satır ayarları döndürür; satır yoksa varsayılanlar. Render başına memoize
// (footer her sayfada okur — tek sorgu paylaşılır).
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const s = await prisma.siteSetting.findUnique({ where: { id: SETTINGS_ID } });
  if (!s) return DEFAULT_SETTINGS;
  return {
    companyName: s.companyName,
    addressLine: s.addressLine,
    phone: s.phone,
    email: s.email,
    whatsapp: s.whatsapp ?? "",
    linkedinUrl: s.linkedinUrl ?? "",
    xUrl: s.xUrl ?? "",
    youtubeUrl: s.youtubeUrl ?? "",
    instagramUrl: s.instagramUrl ?? "",
    metaTitleBase: s.metaTitleBase,
    metaDescBase: s.metaDescBase ?? "",
    notifyEmail: s.notifyEmail ?? "",
    careerPositions:
      s.careerPositions.length > 0 ? s.careerPositions : DEFAULT_SETTINGS.careerPositions,
  };
});

export { SETTINGS_ID };
