import type { NextFetchEvent, NextRequest } from "next/server";
import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Next 16 renamed Middleware to Proxy. The edge-safe authConfig (no Prisma /
// bcrypt) drives the `authorized` callback, which redirects non-admins to
// /admin/login. Real authorization is re-checked server-side in the panel DAL.
const { auth } = NextAuth(authConfig);

// Next 16 needs a statically detectable function export named `proxy`, so we
// delegate to the Auth.js middleware explicitly rather than re-exporting it.
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return (auth as unknown as (
    req: NextRequest,
    ev: NextFetchEvent,
  ) => ReturnType<typeof auth>)(request, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
