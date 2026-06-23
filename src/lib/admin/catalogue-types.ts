import "server-only";

import { prisma } from "@/lib/prisma";
import type { CatalogueTypeOption } from "./catalogue-editor-types";

export type AdminCatalogueTypeRow = {
  id: string;
  slug: string;
  name: string;
  color: string;
  order: number;
  catalogueCount: number;
};

// Tür yönetim ekranı için — kullanım sayısıyla.
export async function getAdminCatalogueTypes(): Promise<AdminCatalogueTypeRow[]> {
  const rows = await prisma.catalogueType.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      color: true,
      order: true,
      _count: { select: { catalogues: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    color: r.color,
    order: r.order,
    catalogueCount: r._count.catalogues,
  }));
}

// Dropdown / rozet için sade liste.
export async function getCatalogueTypeOptions(): Promise<CatalogueTypeOption[]> {
  const rows = await prisma.catalogueType.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true },
  });
  return rows;
}
