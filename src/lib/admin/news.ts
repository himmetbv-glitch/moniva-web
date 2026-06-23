import "server-only";

import { type Locale, type NewsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { EditorNews, NewsTr } from "./news-editor-types";
import { blankEditorNews } from "./news-editor-types";

export type { EditorNews } from "./news-editor-types";
export { blankEditorNews } from "./news-editor-types";

export type AdminNewsRow = {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  status: NewsStatus;
  localeCount: number;
  publishedLabel: string | null;
  updatedLabel: string;
};

export type AdminNewsSummary = {
  total: number;
  published: number;
  draft: number;
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function isoDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pickTitle(
  translations: { locale: Locale; title: string }[],
): string {
  const tr = translations.find((t) => t.locale === DEFAULT_LOCALE);
  return (tr ?? translations[0])?.title ?? "(başlıksız)";
}

export async function getAdminNews(): Promise<{
  rows: AdminNewsRow[];
  summary: AdminNewsSummary;
}> {
  const [posts, total, published, draft] = await Promise.all([
    prisma.newsPost.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        coverImage: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        translations: { select: { locale: true, title: true } },
      },
    }),
    prisma.newsPost.count(),
    prisma.newsPost.count({ where: { status: "PUBLISHED" } }),
    prisma.newsPost.count({ where: { status: "DRAFT" } }),
  ]);

  return {
    rows: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: pickTitle(p.translations),
      coverImage: p.coverImage,
      status: p.status,
      localeCount: p.translations.filter((t) => t.title.trim()).length,
      publishedLabel: p.publishedAt ? dateFmt.format(p.publishedAt) : null,
      updatedLabel: dateFmt.format(p.updatedAt),
    })),
    summary: { total, published, draft },
  };
}

export async function getNewsForEdit(id: string): Promise<EditorNews | null> {
  const p = await prisma.newsPost.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      coverImage: true,
      status: true,
      publishedAt: true,
      translations: {
        select: {
          locale: true,
          title: true,
          excerpt: true,
          body: true,
          metaTitle: true,
          metaDesc: true,
        },
      },
    },
  });
  if (!p) return null;

  const base = blankEditorNews();
  for (const t of p.translations) {
    base.translations[t.locale] = {
      title: t.title ?? "",
      excerpt: t.excerpt ?? "",
      body: t.body ?? "",
      metaTitle: t.metaTitle ?? "",
      metaDesc: t.metaDesc ?? "",
    } satisfies NewsTr;
  }

  return {
    ...base,
    id: p.id,
    slug: p.slug,
    coverImage: p.coverImage ?? "",
    status: p.status,
    publishedAt: p.publishedAt ? isoDateOnly(p.publishedAt) : "",
  };
}
