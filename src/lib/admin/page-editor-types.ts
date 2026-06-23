import type { Locale, NewsStatus } from "@prisma/client";

export type PageTr = {
  title: string;
  body: string;
  metaTitle: string;
  metaDesc: string;
};

export type EditorPage = {
  id: string;
  slug: string;
  status: NewsStatus;
  showInFooter: boolean;
  order: number;
  translations: Record<Locale, PageTr>;
};

export const PAGE_STATUSES: NewsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const PAGE_STATUS_LABELS: Record<NewsStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
};

export const PAGE_STATUS_PILL: Record<NewsStatus, "ok" | "warn" | "mute"> = {
  PUBLISHED: "ok",
  DRAFT: "warn",
  ARCHIVED: "mute",
};

export function blankEditorPage(): EditorPage {
  const blank: PageTr = { title: "", body: "", metaTitle: "", metaDesc: "" };
  return {
    id: "",
    slug: "",
    status: "DRAFT",
    showInFooter: false,
    order: 0,
    translations: {
      TR: { ...blank },
      EN: { ...blank },
      RU: { ...blank },
      AR: { ...blank },
    },
  };
}
