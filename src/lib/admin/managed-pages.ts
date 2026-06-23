import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  EditorManagedPage,
  ManagedPageRow,
} from "./managed-page-editor-types";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export async function getManagedPageList(): Promise<ManagedPageRow[]> {
  const pages = await prisma.managedPage.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      key: true,
      title: true,
      path: true,
      status: true,
      updatedAt: true,
      _count: { select: { sections: true } },
    },
  });

  return pages.map((p) => ({
    key: p.key,
    title: p.title,
    path: p.path,
    status: p.status,
    sectionCount: p._count.sections,
    updatedLabel: dateFmt.format(p.updatedAt),
  }));
}

export async function getManagedPageForEdit(
  key: string,
): Promise<EditorManagedPage | null> {
  const p = await prisma.managedPage.findUnique({
    where: { key },
    include: {
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          key: true,
          type: true,
          name: true,
          kind: true,
          sub: true,
          order: true,
          visible: true,
          data: true,
        },
      },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    key: p.key,
    title: p.title,
    path: p.path,
    status: p.status,
    seoTitle: p.seoTitle,
    seoDesc: p.seoDesc,
    canonical: p.canonical,
    updatedLabel: dateFmt.format(p.updatedAt),
    sections: p.sections.map((s) => ({
      id: s.id,
      key: s.key,
      type: s.type,
      name: s.name,
      kind: s.kind,
      sub: s.sub,
      order: s.order,
      visible: s.visible,
      data: (s.data ?? {}) as Record<string, unknown>,
    })),
  };
}
