"use server";

import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { registerSchema } from "@/lib/validation/register";
import {
  type AuthFormState,
  CUSTOMER_HOME_PATH,
  safeNext,
} from "./customer-auth-types";

export async function customerLoginAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const next = safeNext(formData.get("next"));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, formError: "E-posta veya şifre hatalı." };
    }
    throw error; // NEXT_REDIRECT — propagate
  }
  return { ok: true };
}

export async function registerAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    companyName: formData.get("companyName"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    city: formData.get("city"),
    address: formData.get("address"),
    taxNumber: formData.get("taxNumber") ?? "",
    password: formData.get("password"),
    kvkkConsent: formData.get("kvkkConsent"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: d.email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, formError: "Bu e-posta ile zaten bir hesap var. Giriş yapın." };
  }

  const passwordHash = await bcrypt.hash(d.password, 12);

  try {
    await prisma.user.create({
      data: {
        email: d.email,
        password: passwordHash,
        name: d.fullName,
        role: "CUSTOMER",
        isVerified: false, // admin "B2B doğrula" yapana kadar
        companyName: d.companyName,
        taxNumber: d.taxNumber || null,
        phone: d.phone,
        country: d.country,
        city: d.city,
        address: d.address,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, formError: "Bu e-posta ile zaten bir hesap var." };
    }
    return { ok: false, formError: "Hesap oluşturulamadı, lütfen tekrar deneyin." };
  }

  // Otomatik giriş + hesap paneline yönlendir.
  try {
    await signIn("credentials", {
      email: d.email,
      password: d.password,
      redirectTo: CUSTOMER_HOME_PATH,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Hesap oluştu ama otomatik giriş başarısız — giriş sayfasına yönlendirme yerine bilgi ver.
      return { ok: false, formError: "Hesap oluşturuldu. Lütfen giriş yapın." };
    }
    throw error; // NEXT_REDIRECT
  }
  return { ok: true };
}

export async function customerLogoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
