"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";

export type TypeResult = { ok: boolean; error?: string };

function revalidate() {
  revalidatePath("/admin/catalogues/turler");
  revalidatePath("/admin/catalogues");
  revalidatePath("/kataloglar");
}

function slugify(s: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return (
    s
      .toLowerCase()
      .replace(/[çğıöşü]/g, (c) => map[c] ?? c)
      .replace(/&/g, " ve ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tur"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await prisma.catalogueType.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, { error: "Tür adı gerekli." }).max(60),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, { error: "Geçerli bir renk seçin." })
    .default("#4F3D8C"),
});

export async function upsertCatalogueType(raw: {
  id?: string;
  name: string;
  color: string;
}): Promise<TypeResult> {
  await verifyAdmin();
  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const { id, name, color } = parsed.data;

  try {
    if (id) {
      await prisma.catalogueType.update({ where: { id }, data: { name, color } });
    } else {
      const agg = await prisma.catalogueType.aggregate({ _max: { order: true } });
      const order = (agg._max.order ?? -1) + 1;
      const slug = await uniqueSlug(slugify(name));
      await prisma.catalogueType.create({ data: { name, color, slug, order } });
    }
    revalidate();
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Bu tür zaten var." };
    }
    return { ok: false, error: "Kaydedilemedi." };
  }
}

const idSchema = z.object({ id: z.string().min(1) });

export async function deleteCatalogueType(formData: FormData): Promise<TypeResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false };

  const t = await prisma.catalogueType.findUnique({
    where: { id: parsed.data.id },
    select: { _count: { select: { catalogues: true } } },
  });
  if (!t) return { ok: false };
  if (t._count.catalogues > 0) {
    return { ok: false, error: "Bu türde katalog var. Önce onları başka türe taşıyın." };
  }

  await prisma.catalogueType.delete({ where: { id: parsed.data.id } });
  revalidate();
  return { ok: true };
}

const moveSchema = z.object({ id: z.string().min(1), dir: z.enum(["up", "down"]) });

export async function moveCatalogueType(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = moveSchema.safeParse({ id: formData.get("id"), dir: formData.get("dir") });
  if (!parsed.success) return;

  const all = await prisma.catalogueType.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const idx = all.findIndex((t) => t.id === parsed.data.id);
  if (idx === -1) return;
  const swap = parsed.data.dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;

  const pos = all.map((_, i) => i);
  [pos[idx], pos[swap]] = [pos[swap], pos[idx]];

  await prisma.$transaction(
    all.map((t, i) => prisma.catalogueType.update({ where: { id: t.id }, data: { order: pos[i] } })),
  );
  revalidate();
}
