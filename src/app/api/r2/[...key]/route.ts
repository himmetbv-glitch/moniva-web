import type { NextRequest } from "next/server";

import { getObject, isR2Configured } from "@/lib/r2/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Yalnızca herkese açık varlık önekleri proxy'lenir.
const PUBLIC_PREFIXES = ["products/", "datasheets/", "news/", "pages/", "catalogues/"];

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> },
) {
  if (!isR2Configured()) {
    return new Response("R2 yapılandırılmamış", { status: 503 });
  }

  const { key: parts } = await ctx.params;
  const key = parts.map((p: string) => decodeURIComponent(p)).join("/");

  if (!PUBLIC_PREFIXES.some((p) => key.startsWith(p)) || key.includes("..")) {
    return new Response("Bulunamadı", { status: 404 });
  }

  try {
    const obj = await getObject(key);
    if (!obj.Body) return new Response("Bulunamadı", { status: 404 });

    const stream = (obj.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream();
    return new Response(stream, {
      headers: {
        "Content-Type": obj.ContentType ?? "application/octet-stream",
        "Content-Length": obj.ContentLength ? String(obj.ContentLength) : "",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") {
      return new Response("Bulunamadı", { status: 404 });
    }
    return new Response("Sunucu hatası", { status: 500 });
  }
}
