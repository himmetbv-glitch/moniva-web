import type { NewsStatus } from "@prisma/client";

export type EditorCatalogue = {
  id: string;
  slug: string;
  title: string;
  typeId: string;
  description: string;
  version: string;
  languages: string[]; // ["EN","TR"]
  pageCount: string; // form string ("" veya sayı)
  status: NewsStatus;
  featured: boolean;
  fileUrl: string; // /api/r2/... veya ""
  fileName: string;
  fileSize: number | null; // bytes
  coverImage: string; // /api/r2/... veya ""
};

// Tip açılır menüsü / rozet için yönetilebilir tür özeti.
export type CatalogueTypeOption = {
  id: string;
  name: string;
  color: string;
};

export const CAT_STATUS_LABELS: Record<NewsStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
};

export const CAT_STATUS_PILL: Record<NewsStatus, "ok" | "warn" | "mute"> = {
  PUBLISHED: "ok",
  DRAFT: "warn",
  ARCHIVED: "mute",
};

export const CAT_STATUSES: NewsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

// Dil etiketi seçenekleri (languages[] için).
export const CATALOGUE_LANG_OPTIONS = ["TR", "EN", "RU", "AR"] as const;

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function blankEditorCatalogue(): EditorCatalogue {
  return {
    id: "",
    slug: "",
    title: "",
    typeId: "",
    description: "",
    version: "",
    languages: ["TR"],
    pageCount: "",
    status: "DRAFT",
    featured: false,
    fileUrl: "",
    fileName: "",
    fileSize: null,
    coverImage: "",
  };
}
