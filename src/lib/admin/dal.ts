import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ADMIN_LOGIN_PATH } from "@/lib/actions/auth-types";

/**
 * Secure server-side admin gate. Proxy does the optimistic redirect; this is the
 * authoritative check used by the panel layout, pages and admin Server Actions.
 * Memoized per render pass so multiple callers share one session read.
 */
export const verifyAdmin = cache(async () => {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(ADMIN_LOGIN_PATH);
  }

  return session.user;
});
