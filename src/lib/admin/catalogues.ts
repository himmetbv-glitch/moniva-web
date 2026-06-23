import "server-only";

import type { NewsStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { EditorCatalogue } from "./catalogue-editor-types";
import { blankEditorCatalogue } from "./catalogue-editor-types";

export type { EditorCatalogue } from "./catalogue-editor-types";
export { blankEditorCatalogue } from "./catalogue-editor-types";

export type AdminCatalogueRow = {
  id: string;
  slug: string;
  title: string;
  typeName: string;
  typeColor: string;
  languages: string[];
  version: string | null;
  pageCount: number | null;
  fileSize: number | null;
  hasFile: boolean;
  coverImage: string | null;
  downloadCount: number;
  featured: boolean;
  status: NewsStatus;
  updatedLabel: string;
};

export type AdminCatalogueSummary = {
  published: number;
  draft: number;
  total: number;
  totalDownloads: number;
  languages: string[];
  totalStorageBytes: number;
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export async function getAdminCatalogues(): Promise<{
  rows: AdminCatalogueRow[];
  summary: AdminCatalogueSummary;
}> {
  const cats = await prisma.catalogue.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      type: { select: { name: true, color: true } },
      languages: true,
      version: true,
      pageCount: true,
      fileUrl: true,
      fileSize: true,
      coverImage: true,
      downloadCount: true,
      featured: true,
      status: true,
      updatedAt: true,
    },
  });

  const langSet = new Set<string>();
  let totalDownloads = 0;
  let totalStorageBytes = 0;
  let published = 0;
  let draft = 0;
  for (const c of cats) {
    c.languages.forEach((l) => langSet.add(l));
    totalDownloads += c.downloadCount;
    totalStorageBytes += c.fileSize ?? 0;
    if (c.status === "PUBLISHED") published++;
    if (c.status === "DRAFT") draft++;
  }

  return {
    rows: cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      typeName: c.type.name,
      typeColor: c.type.color,
      languages: c.languages,
      version: c.version,
      pageCount: c.pageCount,
      fileSize: c.fileSize,
      hasFile: Boolean(c.fileUrl),
      coverImage: c.coverImage,
      downloadCount: c.downloadCount,
      featured: c.featured,
      status: c.status,
      updatedLabel: dateFmt.format(c.updatedAt),
    })),
    summary: {
      published,
      draft,
      total: cats.length,
      totalDownloads,
      languages: [...langSet].sort(),
      totalStorageBytes,
    },
  };
}

export async function getCatalogueForEdit(id: string): Promise<EditorCatalogue | null> {
  const c = await prisma.catalogue.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      typeId: true,
      description: true,
      version: true,
      languages: true,
      pageCount: true,
      status: true,
      featured: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      coverImage: true,
    },
  });
  if (!c) return null;

  return {
    ...blankEditorCatalogue(),
    id: c.id,
    slug: c.slug,
    title: c.title,
    typeId: c.typeId,
    description: c.description ?? "",
    version: c.version ?? "",
    languages: c.languages,
    pageCount: c.pageCount != null ? String(c.pageCount) : "",
    status: c.status,
    featured: c.featured,
    fileUrl: c.fileUrl ?? "",
    fileName: c.fileName ?? "",
    fileSize: c.fileSize,
    coverImage: c.coverImage ?? "",
  };
}
