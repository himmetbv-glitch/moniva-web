import "server-only";

import { prisma } from "@/lib/prisma";
import { formatFileSize } from "@/lib/admin/catalogue-editor-types";

export type PublicCatalogue = {
  id: string;
  slug: string;
  title: string;
  typeId: string;
  typeName: string;
  typeColor: string;
  languages: string[];
  version: string | null;
  pageCount: number | null;
  sizeLabel: string;
  coverImage: string | null;
  description: string | null;
  featured: boolean;
};

export type PublicCatalogueType = { id: string; name: string; color: string };

export type CatalogueStats = {
  count: number;
  languages: string[];
  maxPages: number;
};

// Yayında VE PDF dosyası olan kataloglar + tür sırası.
export async function getPublishedCatalogues(): Promise<{
  catalogues: PublicCatalogue[];
  types: PublicCatalogueType[];
  stats: CatalogueStats;
}> {
  const [rows, types] = await Promise.all([
    prisma.catalogue.findMany({
      where: { status: "PUBLISHED", fileUrl: { not: null } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        typeId: true,
        type: { select: { name: true, color: true } },
        languages: true,
        version: true,
        pageCount: true,
        fileSize: true,
        coverImage: true,
        description: true,
        featured: true,
      },
    }),
    prisma.catalogueType.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);

  const langSet = new Set<string>();
  let maxPages = 0;
  for (const r of rows) {
    r.languages.forEach((l) => langSet.add(l));
    if (r.pageCount && r.pageCount > maxPages) maxPages = r.pageCount;
  }

  return {
    catalogues: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      typeId: r.typeId,
      typeName: r.type.name,
      typeColor: r.type.color,
      languages: r.languages,
      version: r.version,
      pageCount: r.pageCount,
      sizeLabel: formatFileSize(r.fileSize),
      coverImage: r.coverImage,
      description: r.description,
      featured: r.featured,
    })),
    types,
    stats: {
      count: rows.length,
      languages: [...langSet].sort(),
      maxPages,
    },
  };
}
