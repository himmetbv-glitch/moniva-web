import type { NextRequest } from "next/server";

import { BLOCKED_BOTS } from "@/lib/bot-block";

// robots.txt HOST'a göre üretilir (build-time değil, istek anında):
//   - moniva.com.tr (ve www)  → tarama serbest
//   - vercel.app demo, preview → tamamen kapalı
// Böylece go-live'da dosya değiştirmeyi hatırlamak gerekmez; gerçek domain
// bağlandığı an robots kendiliğinden açılır, demo hep kapalı kalır.
export const dynamic = "force-dynamic";

const PROD_HOSTS = new Set(["moniva.com.tr", "www.moniva.com.tr"]);

export function GET(request: NextRequest): Response {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const isProd = PROD_HOSTS.has(host);

  const body = isProd
    ? [
        // Also denied at the edge (vercel.json) and in proxy.ts; this is the
        // polite version for the ones that read robots.txt at all.
        ...BLOCKED_BOTS.map((bot) => `User-agent: ${bot}`),
        "Disallow: /",
        "",
        "User-agent: *",
        "Allow: /",
        // `/*?*` closes every parameterised URL — the filter/sort/page
        // combinations crawlers loop on. Next serves its own assets with a
        // query string too (`/_next/static/…?dpl=`, `/_next/image?url=…`,
        // `/icon.png?…`); the longer Allow rules win over `/*?*`, so Googlebot
        // can still render pages. Product photos are served from /api/r2/
        // (CDN-cached, immutable) and stay crawlable for image search.
        "Allow: /_next/",
        "Allow: /icon.png",
        "Allow: /apple-icon.png",
        "Allow: /favicon.ico",
        "Allow: /api/r2/",
        "Disallow: /*?*",
        "Disallow: /admin",
        "Disallow: /api/",
        "Disallow: /*/giris",
        "Disallow: /*/kayit",
        "Disallow: /*/hesabim",
        "Disallow: /*/teklif-listem",
        "Disallow: /*/teklif/",
        "",
        "Sitemap: https://www.moniva.com.tr/sitemap.xml",
        "",
      ].join("\n")
    : ["User-agent: *", "Disallow: /", ""].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
