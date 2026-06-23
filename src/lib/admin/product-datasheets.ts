import "server-only";

import type { Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type EditorDatasheet = {
  id: string;
  locale: Locale;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
};

export async function getProductDatasheets(
  productId: string,
): Promise<EditorDatasheet[]> {
  return prisma.datasheet.findMany({
    where: { productId },
    orderBy: { locale: "asc" },
    select: { id: true, locale: true, fileUrl: true, fileName: true, fileSize: true },
  });
}
