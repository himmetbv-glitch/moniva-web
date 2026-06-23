"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { countActiveAdmins } from "@/lib/admin/users";
import { createUserSchema, type CreateUserPayload } from "@/lib/validation/admin-user";

export type UserActionResult = { ok: true } | { ok: false; error: string };
export type CreateUserResult = { ok: true; id: string } | { ok: false; error: string };

const idSchema = z.object({ id: z.string().min(1) });
const roleSchema = z.object({ id: z.string().min(1), role: z.enum(Role) });
const passwordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, { error: "Şifre en az 8 karakter olmalı." }).max(100),
});

function revalidate() {
  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
}

export async function createUser(raw: CreateUserPayload): Promise<CreateUserResult> {
  await verifyAdmin();

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: d.email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Bu e-posta ile zaten bir hesap var." };
  }

  const passwordHash = await bcrypt.hash(d.password, 12);
  const isCustomer = d.role === Role.CUSTOMER;

  try {
    const created = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        password: passwordHash,
        role: d.role,
        // Yönetici daima doğrulanmış sayılır; müşteride admin'in seçimi.
        isVerified: isCustomer ? d.isVerified : true,
        companyName: isCustomer ? d.companyName || null : null,
        phone: isCustomer ? d.phone || null : null,
      },
      select: { id: true },
    });
    revalidate();
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Bu e-posta ile zaten bir hesap var." };
    }
    return { ok: false, error: "Kullanıcı oluşturulamadı." };
  }
}

export async function toggleUserVerified(
  formData: FormData,
): Promise<UserActionResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { isVerified: true },
  });
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { isVerified: !user.isVerified },
  });
  revalidate();
  return { ok: true };
}

export async function setUserPassword(
  formData: FormData,
): Promise<UserActionResult> {
  await verifyAdmin();
  const parsed = passwordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz istek." };
  }
  const { id, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { password: passwordHash } });
  return { ok: true };
}

export async function setUserRole(
  formData: FormData,
): Promise<UserActionResult> {
  const admin = await verifyAdmin();
  const parsed = roleSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  const { id, role } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (target.role === role) return { ok: true };

  // Bir yöneticiyi müşteriye düşürme guard'ları.
  if (role === Role.CUSTOMER && target.role === Role.ADMIN) {
    if (id === admin.id) {
      return { ok: false, error: "Kendi yönetici rolünüzü kaldıramazsınız." };
    }
    if (target.isActive && (await countActiveAdmins()) <= 1) {
      return { ok: false, error: "Son aktif yöneticiyi müşteriye düşüremezsiniz." };
    }
  }

  await prisma.user.update({ where: { id }, data: { role } });
  revalidate();
  return { ok: true };
}

export async function toggleUserActive(
  formData: FormData,
): Promise<UserActionResult> {
  const admin = await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };
  const { id } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." };

  // Pasife alma guard'ları (aktif etmede serbest).
  if (target.isActive) {
    if (id === admin.id) {
      return { ok: false, error: "Kendi hesabınızı pasife alamazsınız." };
    }
    if (target.role === Role.ADMIN && (await countActiveAdmins()) <= 1) {
      return { ok: false, error: "Son aktif yöneticiyi pasife alamazsınız." };
    }
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !target.isActive },
  });
  revalidate();
  return { ok: true };
}
