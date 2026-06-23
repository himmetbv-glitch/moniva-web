export type AuthFormState = {
  ok: boolean;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

export const CUSTOMER_HOME_PATH = "/hesabim";
export const CUSTOMER_LOGIN_PATH = "/giris";

// Açık yönlendirme (open redirect) engeli: yalnız site içi göreli yollar.
export function safeNext(next: unknown): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return CUSTOMER_HOME_PATH;
}
