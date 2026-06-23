import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { Locale } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assetUrl,
  deleteObject,
  isR2Configured,
  keyFromAssetUrl,
  putObject,
} from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const LOCALES = new Set<string>(Object.values(Locale));

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!isR2Configured()) {
    return Response.json({ error: "R2 yapılandırılmamış." }, { status: 503 });
  }

  const { id: productId } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const localeRaw = String(form.get("locale") ?? "");
  if (!(file instanceof File)) {
    return Response.json({ error: "Dosya yok." }, { status: 400 });
  }
  if (!LOCALES.has(localeRaw)) {
    return Response.json({ error: "Geçersiz dil." }, { status: 400 });
  }
  const locale = localeRaw as Locale;
  if (file.type !== "application/pdf") {
    return Response.json({ error: "Yalnızca PDF yükleyin." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Dosya 20 MB sınırını aşıyor." }, { status: 413 });
  }

  const existing = await prisma.datasheet.findUnique({
    where: { productId_locale: { productId, locale } },
    select: { fileUrl: true },
  });

  const key = `datasheets/${productId}/${locale}-${randomUUID()}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    await putObject(key, bytes, "application/pdf");
  } catch {
    return Response.json({ error: "Yükleme başarısız (R2)." }, { status: 502 });
  }

  const fileName = file.name.slice(0, 200);
  const saved = await prisma.datasheet.upsert({
    where: { productId_locale: { productId, locale } },
    create: { productId, locale, fileUrl: assetUrl(key), fileName, fileSize: file.size },
    update: { fileUrl: assetUrl(key), fileName, fileSize: file.size },
    select: { id: true, locale: true, fileUrl: true, fileName: true, fileSize: true },
  });

  // Değiştirme: eski R2 objesini sil.
  if (existing?.fileUrl) {
    const oldKey = keyFromAssetUrl(existing.fileUrl);
    if (oldKey && oldKey !== key) {
      try {
        await deleteObject(oldKey);
      } catch {
        /* yetim obje — sessiz geç */
      }
    }
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/urunler", "layout");

  return Response.json({ datasheet: saved });
}
