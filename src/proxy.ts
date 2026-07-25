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

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return authProxy(request, event);
  }
  return intlMiddleware(request);
}

export const config = {
  // Cover /admin/* (auth) plus every public site path. Excluded: /api/*,
  // Next internals, static asset requests (any URL with a file extension), and
  // /prism-core (standalone WebGL demo with its own root layout — it must not
  // be rewritten to a locale prefix).
  matcher: ["/((?!api|_next|_vercel|prism-core|.*\\..*).*)"],
};
