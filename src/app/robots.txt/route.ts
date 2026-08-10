import type { NextRequest } from "next/server";

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
    ? ["User-agent: *", "Allow: /", "Disallow: /admin/", "Disallow: /api/", ""].join("\n")
    : ["User-agent: *", "Disallow: /", ""].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
