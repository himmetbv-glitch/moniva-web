import "server-only";

import type { NewsStatus, SectionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { QUALITY_PAGE, QUALITY_SECTIONS } from "./quality-sections";

export type QualitySection = {
  key: string;
  type: SectionType;
  data: Record<string, unknown>;
};

export type QualityContent = {
  status: NewsStatus;
  sections: QualitySection[];
};

export async function getQualitySeo(): Promise<{
  seoTitle: string | null;
  seoDesc: string | null;
  canonical: string | null;
}> {
  const page = await prisma.managedPage.findUnique({
    where: { key: QUALITY_PAGE.key },
    select: { seoTitle: true, seoDesc: true, canonical: true },
  });
  return {
    seoTitle: page?.seoTitle ?? QUALITY_PAGE.seoTitle,
    seoDesc: page?.seoDesc ?? QUALITY_PAGE.seoDesc,
    canonical: page?.canonical ?? null,
  };
}

export async function getQualityContent(): Promise<QualityContent> {
  const page = await prisma.managedPage.findUnique({
    where: { key: QUALITY_PAGE.key },
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
      sections: QUALITY_SECTIONS.filter((s) => s.visible).map((s) => ({
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
