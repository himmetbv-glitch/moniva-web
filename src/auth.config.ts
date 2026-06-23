import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config. No Prisma / bcrypt imports here so it can run
 * inside `proxy.ts` (Next 16 proxy / middleware). The Credentials provider with
 * its Node-only dependencies lives in `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Persist role onto the token at sign-in, then expose it on the session.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = token.role as Role;
        session.user.isVerified = Boolean(token.isVerified);
      }
      return session;
    },
    // Optimistic check used by proxy: only ADMIN may enter /admin (except /admin/login).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdminArea =
        pathname.startsWith("/admin") && pathname !== "/admin/login";
      if (isAdminArea) {
        return auth?.user?.role === "ADMIN";
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
