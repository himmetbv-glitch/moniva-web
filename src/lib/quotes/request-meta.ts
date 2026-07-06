import "server-only";

import { headers } from "next/headers";
import { createHash } from "node:crypto";

export type RequestMeta = { device: string; ipHash: string | null };

/** İstek başlıklarından cihaz + tuzlanmış IP hash'i türetir (ham IP saklanmaz). */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const ipRaw = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "")
    .split(",")[0]
    .trim();

  const device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
  const salt = process.env.AUTH_SECRET ?? "moniva-quote";
  const ipHash = ipRaw
    ? createHash("sha256").update(`${salt}:${ipRaw}`).digest("hex").slice(0, 32)
    : null;

  return { device, ipHash };
}
