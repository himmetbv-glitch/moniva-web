"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, passwordChangeSchema } from "@/lib/validation/profile";
import type { AuthFormState } from "./customer-auth-types";

export async function updateProfileAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, formError: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
  }

  const parsed = profileSchema.safeParse({
    companyName: formData.get("companyName"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    taxNumber: formData.get("taxNumber") ?? "",
    taxOffice: formData.get("taxOffice") ?? "",
    city: formData.get("city") ?? "",
    address: formData.get("address") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: d.fullName,
      companyName: d.companyName,
      phone: d.phone,
      taxNumber: d.taxNumber || null,
      taxOffice: d.taxOffice || null,
      city: d.city || null,
      address: d.address || null,
    },
  });

  revalidatePath("/hesabim/profil");
  revalidatePath("/hesabim");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, formError: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user?.password) {
    return { ok: false, formError: "Bu hesapta şifre tanımlı değil." };
  }

  const valid = await bcrypt.compare(d.currentPassword, user.password);
  if (!valid) {
    return { ok: false, fieldErrors: { currentPassword: ["Mevcut şifre hatalı."] } };
  }

  const newHash = await bcrypt.hash(d.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: newHash },
  });

  return { ok: true };
}
