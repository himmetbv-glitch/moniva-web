"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { deleteObject, keyFromAssetUrl } from "@/lib/r2/client";

export type DatasheetActionResult = { ok: true } | { ok: false; error: string };

export async function deleteDatasheet(id: string): Promise<DatasheetActionResult> {
  await verifyAdmin();
  const ds = await prisma.datasheet.findUnique({
    where: { id },
    select: { id: true, productId: true, fileUrl: true },
  });
  if (!ds) return { ok: false, error: "Datasheet bulunamadı." };

  await prisma.datasheet.delete({ where: { id } });

  const key = keyFromAssetUrl(ds.fileUrl);
  if (key) {
    try {
      await deleteObject(key);
    } catch {
      /* yetim obje — sessiz geç */
    }
  }

  revalidatePath(`/admin/products/${ds.productId}`);
  revalidatePath("/urunler", "layout");
  return { ok: true };
}
