import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { CACHE_SCOPE, CACHE_SECONDS, SETTINGS_TAG } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/admin/settings-types";

const SETTINGS_ID = "singleton";

// Tek satır ayarları döndürür; satır yoksa varsayılanlar. Her sayfanın footer'ı
// okuduğu için istekler arası veri önbelleğinde (1 sa, "settings" etiketi) +
// render başına memoize. Ayarlar formu kaydedince `updateTag(SETTINGS_TAG)`.
export const getSettings = cache(() => cachedSettings());

// Önbelleksiz okuma — admin formu, script'le değişmiş değeri bayat görmesin.
export async function loadSettings(): Promise<SiteSettings> {
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
}

const cachedSettings = unstable_cache(loadSettings, ["site-settings", CACHE_SCOPE], {
  revalidate: CACHE_SECONDS,
  tags: [SETTINGS_TAG],
});

export { SETTINGS_ID };
