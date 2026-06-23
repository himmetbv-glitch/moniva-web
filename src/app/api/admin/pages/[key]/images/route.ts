import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assetUrl, isR2Configured, putObject } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ key: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!isR2Configured()) {
    return Response.json({ error: "R2 yapılandırılmamış." }, { status: 503 });
  }

  const { key: pageKey } = await ctx.params;
  const page = await prisma.managedPage.findUnique({
    where: { key: pageKey },
    select: { key: true },
  });
  if (!page) {
    return Response.json({ error: "Sayfa bulunamadı." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Dosya yok." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return Response.json(
      { error: "Geçersiz tür. JPEG, PNG veya WebP yükleyin." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Dosya 8 MB sınırını aşıyor." }, { status: 413 });
  }

  const objectKey = `pages/${page.key}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    await putObject(objectKey, bytes, file.type);
  } catch {
    return Response.json({ error: "Yükleme başarısız (R2)." }, { status: 502 });
  }

  return Response.json({ url: assetUrl(objectKey) });
}
