import "server-only";

import { type Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export type PublicPage = {
  slug: string;
  title: string;
  body: string;
  metaTitle: string | null;
  metaDesc: string | null;
  updatedLabel: string;
  paragraphs: string[];
};

export type FooterPageLink = {
  slug: string;
  title: string;
};

const fullFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

type TrRow = {
  locale: Locale;
  title: string;
  body: string;
  metaTitle: string | null;
  metaDesc: string | null;
};

function pick(translations: TrRow[]): TrRow | undefined {
  return translations.find((t) => t.locale === DEFAULT_LOCALE) ?? translations[0];
}

export async function getPageBySlug(slug: string): Promise<PublicPage | null> {
  const p = await prisma.page.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      updatedAt: true,
      translations: {
        select: { locale: true, title: true, body: true, metaTitle: true, metaDesc: true },
      },
    },
  });
  if (!p) return null;

  const tr = pick(p.translations);
  const body = tr?.body ?? "";
  return {
    slug: p.slug,
    title: tr?.title ?? "(başlıksız)",
    body,
    metaTitle: tr?.metaTitle ?? null,
    metaDesc: tr?.metaDesc ?? null,
    updatedLabel: fullFmt.format(p.updatedAt),
    paragraphs: body
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export async function getFooterPages(): Promise<FooterPageLink[]> {
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED", showInFooter: true },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: {
      slug: true,
      translations: { select: { locale: true, title: true } },
    },
  });

  return pages.map((p) => {
    const tr =
      p.translations.find((t) => t.locale === DEFAULT_LOCALE) ?? p.translations[0];
    return { slug: p.slug, title: tr?.title ?? p.slug };
  });
}
