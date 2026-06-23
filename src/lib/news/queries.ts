import "server-only";

import { type Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export type PublicNewsCard = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  day: string;
  mon: string;
  year: string;
  dateLabel: string;
};

export type PublicNewsDetail = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  dateLabel: string;
  paragraphs: string[];
};

const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "2-digit" });
const monFmt = new Intl.DateTimeFormat("tr-TR", { month: "short" });
const yearFmt = new Intl.DateTimeFormat("tr-TR", { year: "numeric" });
const fullFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

type TrRow = { locale: Locale; title: string; excerpt: string | null; body: string };

function pick(translations: TrRow[]): TrRow | undefined {
  return translations.find((t) => t.locale === DEFAULT_LOCALE) ?? translations[0];
}

export async function getPublishedNews(): Promise<PublicNewsCard[]> {
  const now = new Date();
  const posts = await prisma.newsPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null, lte: now } },
    orderBy: [{ publishedAt: "desc" }],
    select: {
      slug: true,
      coverImage: true,
      publishedAt: true,
      translations: { select: { locale: true, title: true, excerpt: true, body: true } },
    },
  });

  return posts.map((p) => {
    const tr = pick(p.translations);
    const d = p.publishedAt ?? new Date();
    return {
      slug: p.slug,
      title: tr?.title ?? "(başlıksız)",
      excerpt: tr?.excerpt ?? "",
      coverImage: p.coverImage,
      day: dayFmt.format(d),
      mon: monFmt.format(d).replace(".", "").toUpperCase(),
      year: yearFmt.format(d),
      dateLabel: fullFmt.format(d),
    };
  });
}

export async function getNewsBySlug(slug: string): Promise<PublicNewsDetail | null> {
  const now = new Date();
  const p = await prisma.newsPost.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { not: null, lte: now } },
    select: {
      slug: true,
      coverImage: true,
      publishedAt: true,
      translations: { select: { locale: true, title: true, excerpt: true, body: true } },
    },
  });
  if (!p) return null;

  const tr = pick(p.translations);
  const body = tr?.body ?? "";
  return {
    slug: p.slug,
    title: tr?.title ?? "(başlıksız)",
    excerpt: tr?.excerpt ?? "",
    body,
    coverImage: p.coverImage,
    dateLabel: fullFmt.format(p.publishedAt ?? new Date()),
    paragraphs: body
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
