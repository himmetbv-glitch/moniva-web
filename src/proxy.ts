import type { NextFetchEvent, NextRequest } from "next/server";
import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";

import { authConfig } from "@/auth.config";
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

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
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
