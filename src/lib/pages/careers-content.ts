import "server-only";

import type { NewsStatus, SectionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CAREERS_PAGE, CAREERS_SECTIONS } from "./careers-sections";

export type CareersSection = {
  key: string;
  type: SectionType;
  data: Record<string, unknown>;
};

export type CareersContent = {
  status: NewsStatus;
  sections: CareersSection[];
};

export async function getCareersSeo(): Promise<{
  seoTitle: string | null;
  seoDesc: string | null;
  canonical: string | null;
}> {
  const page = await prisma.managedPage.findUnique({
    where: { key: CAREERS_PAGE.key },
    select: { seoTitle: true, seoDesc: true, canonical: true },
  });
  return {
    seoTitle: page?.seoTitle ?? CAREERS_PAGE.seoTitle,
    seoDesc: page?.seoDesc ?? CAREERS_PAGE.seoDesc,
    canonical: page?.canonical ?? null,
  };
}

export async function getCareersContent(): Promise<CareersContent> {
  const page = await prisma.managedPage.findUnique({
    where: { key: CAREERS_PAGE.key },
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
      sections: CAREERS_SECTIONS.filter((s) => s.visible).map((s) => ({
        key: s.key,
        type: s.type,
        data: s.data,
      })),
    };
  }

  return {
    status: page.status,
    sections: page.sections.map((s) => ({
      key: s.key,
      type: s.type,
      data: (s.data ?? {}) as Record<string, unknown>,
    })),
  };
}
