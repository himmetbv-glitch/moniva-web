import type { NewsStatus, SectionType } from "@prisma/client";

export type EditorSection = {
  id: string;
  key: string;
  type: SectionType;
  name: string;
  kind: string;
  sub: string | null;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
};

export type EditorManagedPage = {
  id: string;
  key: string;
  title: string;
  path: string;
  status: NewsStatus;
  seoTitle: string | null;
  seoDesc: string | null;
  canonical: string | null;
  updatedLabel: string;
  sections: EditorSection[];
};

export type ManagedPageRow = {
  key: string;
  title: string;
  path: string;
  status: NewsStatus;
  sectionCount: number;
  updatedLabel: string;
};

export const SECTION_STATUS_LABELS: Record<NewsStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
};

export const SECTION_STATUS_PILL: Record<NewsStatus, string> = {
  DRAFT: "warn",
  PUBLISHED: "ok",
  ARCHIVED: "mute",
};
