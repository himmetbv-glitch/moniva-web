import "server-only";

import { prisma } from "@/lib/prisma";
import type { EditorBrand } from "./brand-editor-types";

export type { EditorBrand } from "./brand-editor-types";
export { blankEditorBrand } from "./brand-editor-types";

export type AdminBrandCard = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
  isActive: boolean;
  productCount: number;
  color: string;
};

// Marka renkleri şemada yok — addan deterministik üret (kart başlığı için).
const PALETTE = [
  "#4F3D8C", "#0065A3", "#1F8A5B", "#C97A1A", "#B33A3A",
  "#2E1B5C", "#005CA9", "#7E6DC2", "#00558C", "#1A1A2E",
];
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export async function getAdminBrands(): Promise<AdminBrandCard[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      website: true,
      logoUrl: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    website: b.website,
    logoUrl: b.logoUrl,
    isActive: b.isActive,
    productCount: b._count.products,
    color: colorFor(b.name),
  }));
}

export async function getBrandForEdit(id: string): Promise<EditorBrand | null> {
  const b = await prisma.brand.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, website: true, logoUrl: true, isActive: true },
  });
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    website: b.website ?? "",
    logoUrl: b.logoUrl ?? "",
    isActive: b.isActive,
  };
}
