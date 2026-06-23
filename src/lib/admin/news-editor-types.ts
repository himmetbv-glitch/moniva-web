import type { Locale, NewsStatus } from "@prisma/client";

export type NewsTr = {
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDesc: string;
};

export type EditorNews = {
  id: string;
  slug: string;
  coverImage: string; // servis yolu (/api/r2/...) veya ""
  status: NewsStatus;
  publishedAt: string; // yyyy-mm-dd veya ""
  translations: Record<Locale, NewsTr>;
};

export const NEWS_STATUSES: NewsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
};

export const NEWS_STATUS_PILL: Record<NewsStatus, "ok" | "warn" | "mute"> = {
  PUBLISHED: "ok",
  DRAFT: "warn",
  ARCHIVED: "mute",
};

export function blankEditorNews(): EditorNews {
  const blank: NewsTr = { title: "", excerpt: "", body: "", metaTitle: "", metaDesc: "" };
  return {
    id: "",
    slug: "",
    coverImage: "",
    status: "DRAFT",
    publishedAt: "",
    translations: {
      TR: { ...blank },
      EN: { ...blank },
      RU: { ...blank },
      AR: { ...blank },
    },
  };
}
