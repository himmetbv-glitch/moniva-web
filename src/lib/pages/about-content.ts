import "server-only";

import type { Locale, NewsStatus, SectionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { ABOUT_PAGE, ABOUT_SECTIONS } from "./about-sections";
import { pickLocalized } from "./i18n-picker";

export type AboutSection = {
  key: string;
  type: SectionType;
  data: Record<string, unknown>;
};

export type AboutContent = {
  status: NewsStatus;
  sections: AboutSection[];
};

export async function getAboutSeo(): Promise<{
  seoTitle: string | null;
  seoDesc: string | null;
  canonical: string | null;
}> {
  const page = await prisma.managedPage.findUnique({
    where: { key: ABOUT_PAGE.key },
    select: { seoTitle: true, seoDesc: true, canonical: true },
  });
  return {
    seoTitle: page?.seoTitle ?? ABOUT_PAGE.seoTitle,
    seoDesc: page?.seoDesc ?? ABOUT_PAGE.seoDesc,
    canonical: page?.canonical ?? null,
  };
}

export async function getAboutContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<AboutContent> {
  const page = await prisma.managedPage.findUnique({
    where: { key: ABOUT_PAGE.key },
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
      sections: ABOUT_SECTIONS.filter((s) => s.visible).map((s) => ({
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
