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

const MAX_BYTES = 8 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
    select: { id: true, coverImage: true },
  });
  if (!cat) return Response.json({ error: "Katalog bulunamadı." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Dosya yok." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return Response.json({ error: "JPEG, PNG veya WebP yükleyin." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Dosya 8 MB sınırını aşıyor." }, { status: 413 });
  }

  const key = `catalogues/${id}/cover-${randomUUID()}.${ext}`;
  try {
    await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  } catch {
    return Response.json({ error: "Yükleme başarısız (R2)." }, { status: 502 });
  }

  const coverImage = assetUrl(key);
  await prisma.catalogue.update({ where: { id }, data: { coverImage } });

  if (cat.coverImage) {
    const oldKey = keyFromAssetUrl(cat.coverImage);
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
  return Response.json({ coverImage });
}
