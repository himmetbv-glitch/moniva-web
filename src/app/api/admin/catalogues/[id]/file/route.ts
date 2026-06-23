import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

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

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!isR2Configured()) {
    return Response.json({ error: "R2 yapılandırılmamış." }, { status: 503 });
  }

  const { id } = await ctx.params;
  const cat = await prisma.catalogue.findUnique({
    where: { id },
    select: { id: true, fileUrl: true },
  });
  if (!cat) return Response.json({ error: "Katalog bulunamadı." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Dosya yok." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return Response.json({ error: "Yalnızca PDF yükleyin." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Dosya 50 MB sınırını aşıyor." }, { status: 413 });
  }

  const key = `catalogues/${id}/${randomUUID()}.pdf`;
  try {
    await putObject(key, new Uint8Array(await file.arrayBuffer()), "application/pdf");
  } catch {
    return Response.json({ error: "Yükleme başarısız (R2)." }, { status: 502 });
  }

  const fileUrl = assetUrl(key);
  const fileName = file.name.slice(0, 200);
  await prisma.catalogue.update({
    where: { id },
    data: { fileUrl, fileName, fileSize: file.size },
  });

  // Eski PDF'i sil.
  if (cat.fileUrl) {
    const oldKey = keyFromAssetUrl(cat.fileUrl);
    if (oldKey && oldKey !== key) {
      try {
        await deleteObject(oldKey);
      } catch {
        /* yetim obje */
      }
    }
  }

  revalidatePath(`/admin/catalogues/${id}`);
  revalidatePath("/kataloglar");
  return Response.json({ fileUrl, fileName, fileSize: file.size });
}
