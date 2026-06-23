import "server-only";

import { prisma } from "@/lib/prisma";

export type EditorImage = {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
  order: number;
};

export async function getProductImages(productId: string): Promise<EditorImage[]> {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ order: "asc" }],
    select: { id: true, url: true, alt: true, isMain: true, order: true },
  });
}
