import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getObject, isR2Configured } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Yetkisiz", { status: 403 });
  }
  if (!isR2Configured()) {
    return new Response("R2 yapılandırılmamış", { status: 503 });
  }

  const { id } = await ctx.params;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: { cvKey: true, cvFileName: true },
  });
  if (!app?.cvKey) {
    return new Response("CV bulunamadı", { status: 404 });
  }

  const fileName = app.cvFileName ?? `cv-${id}`;
  const ext = extOf(fileName) || extOf(app.cvKey);
  const contentType = CONTENT_TYPE[ext] ?? "application/octet-stream";
  // RFC 5987 — Türkçe/özel karakterli dosya adları için.
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_");
  const utf8Name = encodeURIComponent(fileName);

  try {
    const obj = await getObject(app.cvKey);
    if (!obj.Body) return new Response("CV bulunamadı", { status: 404 });

    const stream = (obj.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream();
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": obj.ContentLength ? String(obj.ContentLength) : "",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") {
      return new Response("CV bulunamadı", { status: 404 });
    }
    return new Response("Sunucu hatası", { status: 500 });
  }
}
