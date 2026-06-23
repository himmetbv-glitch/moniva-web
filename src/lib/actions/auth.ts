"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validation/auth";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_LOGIN_PATH,
  type LoginFormState,
} from "./auth-types";

export async function loginAction(
  _prev: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: ADMIN_DASHBOARD_PATH,
    });
  } catch (error) {
    // signIn throws NEXT_REDIRECT on success — must propagate.
    if (error instanceof AuthError) {
      return { ok: false, formError: "E-posta veya şifre hatalı." };
    }
    throw error;
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: ADMIN_LOGIN_PATH });
}
