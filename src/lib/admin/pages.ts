import "server-only";

import { type Locale, type NewsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { EditorPage, PageTr } from "./page-editor-types";
import { blankEditorPage } from "./page-editor-types";

export type { EditorPage } from "./page-editor-types";
export { blankEditorPage } from "./page-editor-types";

export type AdminPageRow = {
  id: string;
  slug: string;
  title: string;
  status: NewsStatus;
  localeCount: number;
  showInFooter: boolean;
  updatedLabel: string;
};

export type AdminPageSummary = {
  total: number;
  published: number;
  draft: number;
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function pickTitle(translations: { locale: Locale; title: string }[]): string {
  const tr = translations.find((t) => t.locale === DEFAULT_LOCALE);
  return (tr ?? translations[0])?.title ?? "(başlıksız)";
}

export async function getAdminPages(): Promise<{
  rows: AdminPageRow[];
  summary: AdminPageSummary;
}> {
  const [pages, total, published, draft] = await Promise.all([
    prisma.page.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        status: true,
        showInFooter: true,
        updatedAt: true,
        translations: { select: { locale: true, title: true } },
      },
    }),
    prisma.page.count(),
    prisma.page.count({ where: { status: "PUBLISHED" } }),
    prisma.page.count({ where: { status: "DRAFT" } }),
  ]);

  return {
    rows: pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: pickTitle(p.translations),
      status: p.status,
      localeCount: p.translations.filter((t) => t.title.trim()).length,
      showInFooter: p.showInFooter,
      updatedLabel: dateFmt.format(p.updatedAt),
    })),
    summary: { total, published, draft },
  };
}

export async function getPageForEdit(id: string): Promise<EditorPage | null> {
  const p = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      showInFooter: true,
      order: true,
      translations: {
        select: {
          locale: true,
          title: true,
          body: true,
          metaTitle: true,
          metaDesc: true,
        },
      },
    },
  });
  if (!p) return null;

  const base = blankEditorPage();
  for (const t of p.translations) {
    base.translations[t.locale] = {
      title: t.title ?? "",
      body: t.body ?? "",
      metaTitle: t.metaTitle ?? "",
      metaDesc: t.metaDesc ?? "",
    } satisfies PageTr;
  }

  return {
    ...base,
    id: p.id,
    slug: p.slug,
    status: p.status,
    showInFooter: p.showInFooter,
    order: p.order,
  };
}
