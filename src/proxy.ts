import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";

import { authConfig } from "@/auth.config";
import { isBlockedBot } from "@/lib/bot-block";
import { routing } from "@/i18n/routing";

// Next 16 renamed Middleware to Proxy. Two responsibilities compose here:
//   1. /admin/*      → NextAuth (redirects non-admins to /admin/login).
//   2. public site   → next-intl locale routing (/tr, /en, /ru, /ar).
// The edge-safe authConfig (no Prisma / bcrypt) drives Auth.js's authorized
// callback; real authorization is re-checked server-side in the panel DAL.
const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

const authProxy = auth as unknown as (
  req: NextRequest,
  ev: NextFetchEvent,
) => ReturnType<typeof auth>;

// Gerçek domain dışındaki her host (vercel.app demo, preview'lar) arama
// motorlarına kapalı: robots.txt (route handler) taramayı, bu başlık ise
// indekslemeyi engeller. moniva.com.tr bağlandığında kendiliğinden açılır.
const PROD_HOSTS = new Set(["moniva.com.tr", "www.moniva.com.tr"]);

function withRobotsHeader(request: NextRequest, res: Response): Response {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!PROD_HOSTS.has(host)) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

// Eski demo adresi kalıcı olarak gerçek domain'e taşınır. Yalnız bu sabit
// alias; deploy'a özel preview URL'leri (moniva-web-git-*.vercel.app) açık kalır.
const LEGACY_HOSTS = new Set(["moniva-web.vercel.app"]);
const CANONICAL_ORIGIN = "https://www.moniva.com.tr";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // First of all: in production vercel.json already denies these at the edge,
  // so this only fires if that rule is bypassed (and locally, where vercel.json
  // does not apply). The header tells the two layers apart in a 403.
  if (isBlockedBot(request.headers.get("user-agent"))) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "x-blocked-by": "proxy-ua", "Cache-Control": "no-store" },
    });
  }

  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (LEGACY_HOSTS.has(host)) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(new URL(pathname + search, CANONICAL_ORIGIN), 308);
  }

  const res = request.nextUrl.pathname.startsWith("/admin")
    ? await authProxy(request, event)
    : intlMiddleware(request);
  return withRobotsHeader(request, res as Response);
}

export const config = {
  // Cover /admin/* (auth) plus every public site path. Excluded: /api/*,
  // Next internals, and static asset requests (any URL with a file extension).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
