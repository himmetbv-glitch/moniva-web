import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CUSTOMER_LOGIN_PATH } from "@/lib/actions/customer-auth-types";

/**
 * Giriş yapmış kullanıcıyı döndürür; yoksa /giris'e yönlendirir.
 * Hem CUSTOMER hem ADMIN bir "user"dır — kendi tekliflerini userId üzerinden görür.
 * Render başına memoize.
 */
export const requireUser = cache(async (next?: string) => {
  const session = await auth();
  if (!session?.user) {
    redirect(next ? `${CUSTOMER_LOGIN_PATH}?next=${encodeURIComponent(next)}` : CUSTOMER_LOGIN_PATH);
  }
  return session.user;
});

export const getOptionalUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});
