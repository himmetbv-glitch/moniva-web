"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { buildProductWhere } from "@/lib/admin/products";

const idSchema = z.object({ id: z.string().min(1) });

const moveSchema = z.object({
  id: z.string().min(1),
  dir: z.enum(["up", "down"]),
  kategori: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  q: z.string().optional(),
});

/**
 * Ürünü filtrelenmiş listede bir üst/alt sıraya taşır.
 * Global `sortOrder` kanonik sıraya (0..N-1) normalize edilir; taşınan ürün ile
 * filtrelenmiş listedeki komşusunun pozisyonları takas edilir. İlk taşımada tüm
 * katalog bir kez normalize olur, sonraki taşımalarda yalnızca 2 satır güncellenir.
 */
export async function moveProductOrder(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    dir: formData.get("dir"),
    kategori: formData.get("kategori") || undefined,
    status: formData.get("status") || undefined,
    q: formData.get("q") || undefined,
  });
  if (!parsed.success) return;
  const { id, dir, kategori, status, q } = parsed.data;

  const order: Prisma.ProductOrderByWithRelationInput[] = [
    { sortOrder: "asc" },
    { createdAt: "desc" },
    { sku: "asc" },
  ];

  const [global, filtered] = await Promise.all([
    prisma.product.findMany({ orderBy: order, select: { id: true, sortOrder: true } }),
    prisma.product.findMany({
      where: buildProductWhere({ kategori, status, q }),
      orderBy: order,
      select: { id: true },
    }),
  ]);

  const fIdx = filtered.findIndex((p) => p.id === id);
  if (fIdx === -1) return;
  const fTarget = dir === "up" ? fIdx - 1 : fIdx + 1;
  if (fTarget < 0 || fTarget >= filtered.length) return;
  const neighborId = filtered[fTarget].id;

  // Kanonik pozisyonlar (0..N-1), sonra iki ürünün pozisyonunu takas et.
  const pos = new Map(global.map((p, i) => [p.id, i]));
  const pi = pos.get(id);
  const pn = pos.get(neighborId);
  if (pi == null || pn == null) return;
  pos.set(id, pn);
  pos.set(neighborId, pi);

  const updates = global
    .filter((p) => p.sortOrder !== pos.get(p.id))
    .map((p) =>
      prisma.product.update({ where: { id: p.id }, data: { sortOrder: pos.get(p.id)! } }),
    );
  if (updates.length === 0) return;

  await prisma.$transaction(updates);

  revalidatePath("/admin/products");
  revalidatePath("/urunler");
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const current = await prisma.product.findUnique({
    where: { id: parsed.data.id },
    select: { isActive: true },
  });
  if (!current) return;

  await prisma.product.update({
    where: { id: parsed.data.id },
    data: { isActive: !current.isActive },
  });
  revalidatePath("/admin/products");
}

export async function toggleProductFeatured(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const current = await prisma.product.findUnique({
    where: { id: parsed.data.id },
    select: { isFeatured: true },
  });
  if (!current) return;

  await prisma.product.update({
    where: { id: parsed.data.id },
    data: { isFeatured: !current.isFeatured },
  });
  revalidatePath("/admin/products");
}

export type DeleteResult = { ok: boolean; reason?: "referenced" | "notfound" };

export async function deleteProduct(formData: FormData): Promise<DeleteResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, reason: "notfound" };

  // Geçmiş teklif taleplerini korumak için: bir teklif kaleminde geçen ürün
  // SİLİNMEZ (cascade ile talep kalemleri de silinirdi). Bunun yerine pasife alın.
  const refCount = await prisma.quoteRequestItem.count({
    where: { productId: parsed.data.id },
  });
  if (refCount > 0) return { ok: false, reason: "referenced" };

  await prisma.product.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/products");
  return { ok: true };
}
