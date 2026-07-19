import "server-only";

import type { Locale, NewsStatus, SectionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { CONTACT_PAGE, CONTACT_SECTIONS } from "./contact-sections";
import { pickLocalized } from "./i18n-picker";

export type ContactSection = {
  key: string;
  type: SectionType;
  data: Record<string, unknown>;
};

export type ContactContent = {
  status: NewsStatus;
  sections: ContactSection[];
};

export async function getContactSeo(): Promise<{
  seoTitle: string | null;
  seoDesc: string | null;
  canonical: string | null;
}> {
  const page = await prisma.managedPage.findUnique({
    where: { key: CONTACT_PAGE.key },
    select: { seoTitle: true, seoDesc: true, canonical: true },
  });
  return {
    seoTitle: page?.seoTitle ?? CONTACT_PAGE.seoTitle,
    seoDesc: page?.seoDesc ?? CONTACT_PAGE.seoDesc,
    canonical: page?.canonical ?? null,
  };
}

export async function getContactContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<ContactContent> {
  const page = await prisma.managedPage.findUnique({
    where: { key: CONTACT_PAGE.key },
    include: {
      sections: {
        where: { visible: true },
        orderBy: { order: "asc" },
        select: { key: true, type: true, data: true },
      },
    },
  });

  if (!page) {
    return {
      status: "PUBLISHED",
      sections: CONTACT_SECTIONS.filter((s) => s.visible).map((s) => ({
        key: s.key,
        type: s.type,
        data: pickLocalized(s.data as Record<string, unknown>, locale),
      })),
    };
  }

  return {
    status: page.status,
    sections: page.sections.map((s) => ({
      key: s.key,
      type: s.type,
      data: pickLocalized((s.data ?? {}) as Record<string, unknown>, locale),
    })),
  };
}
