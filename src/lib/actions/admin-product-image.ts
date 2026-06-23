"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { deleteObject, keyFromAssetUrl } from "@/lib/r2/client";

export type ImageActionResult = { ok: true } | { ok: false; error: string };

function revalidate(productId: string) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/urunler");
}

export async function setMainProductImage(imageId: string): Promise<ImageActionResult> {
  await verifyAdmin();
  const img = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true },
  });
  if (!img) return { ok: false, error: "Görsel bulunamadı." };

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: img.productId },
      data: { isMain: false },
    }),
    prisma.productImage.update({ where: { id: imageId }, data: { isMain: true } }),
  ]);
  revalidate(img.productId);
  return { ok: true };
}

export async function deleteProductImage(imageId: string): Promise<ImageActionResult> {
  await verifyAdmin();
  const img = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, url: true, isMain: true },
  });
  if (!img) return { ok: false, error: "Görsel bulunamadı." };

  await prisma.productImage.delete({ where: { id: imageId } });

  // R2'den de sil (başarısız olsa da DB tutarlı kalsın).
  const key = keyFromAssetUrl(img.url);
  if (key) {
    try {
      await deleteObject(key);
    } catch {
      /* yetim obje — sessiz geç */
    }
  }

  // Kapak silindiyse kalan ilk görseli kapak yap.
  if (img.isMain) {
    const next = await prisma.productImage.findFirst({
      where: { productId: img.productId },
      orderBy: [{ order: "asc" }],
      select: { id: true },
    });
    if (next) {
      await prisma.productImage.update({ where: { id: next.id }, data: { isMain: true } });
    }
  }

  revalidate(img.productId);
  return { ok: true };
}

export async function moveProductImage(
  imageId: string,
  dir: "up" | "down",
): Promise<ImageActionResult> {
  await verifyAdmin();
  const img = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, order: true },
  });
  if (!img) return { ok: false, error: "Görsel bulunamadı." };

  const neighbor = await prisma.productImage.findFirst({
    where: {
      productId: img.productId,
      order: dir === "up" ? { lt: img.order } : { gt: img.order },
    },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbor) return { ok: true }; // zaten uçta

  await prisma.$transaction([
    prisma.productImage.update({ where: { id: img.id }, data: { order: neighbor.order } }),
    prisma.productImage.update({ where: { id: neighbor.id }, data: { order: img.order } }),
  ]);
  revalidate(img.productId);
  return { ok: true };
}
