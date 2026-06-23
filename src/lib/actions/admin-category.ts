"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Locale } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { getCategoryAttributes } from "@/lib/admin/categories";
import type { EditorSpecAttr } from "@/lib/admin/category-editor-types";
import {
  categoryEditorSchema,
  type CategoryEditorPayload,
} from "@/lib/validation/admin-category";

export type CatUpsertResult = { ok: true; id: string } | { ok: false; error: string };
export type CatDeleteResult = { ok: boolean; reason?: "has-products" | "has-children" };

export async function upsertCategory(
  raw: CategoryEditorPayload,
): Promise<CatUpsertResult> {
  await verifyAdmin();

  const parsed = categoryEditorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  const translations = Object.entries(d.translations)
    .filter(([, t]) => t.name.trim())
    .map(([locale, t]) => ({
      locale: locale as Locale,
      name: t.name.trim(),
      metaTitle: t.metaTitle?.trim() || null,
      metaDesc: t.metaDesc?.trim() || null,
    }));
  if (translations.length === 0)
    return { ok: false, error: "En az bir dilde kategori adı girmelisiniz." };

  if (d.parentId && d.parentId === d.id)
    return { ok: false, error: "Kategori kendisinin alt kategorisi olamaz." };

  const core = {
    code: d.code,
    slug: d.slug,
    parentId: d.parentId || null,
    order: d.order,
    isActive: d.isActive,
    showInMenu: d.showInMenu,
    isFeatured: d.isFeatured,
  };

  const attrs = d.specAttributes.map((a, i) => ({
    id: a.id,
    name: a.name.trim(),
    type: a.type,
    unit: a.unit?.trim() || null,
    required: a.required,
    order: i,
  }));

  try {
    let id: string;
    if (d.id) {
      id = d.id;
      // Attribute id'leri kategoriye ait mi? (yetki/tutarlılık + yeni/var ayrımı)
      const existing = await prisma.categorySpecAttribute.findMany({
        where: { categoryId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((e) => e.id));
      const keepIds = attrs.filter((a) => a.id && existingIds.has(a.id)).map((a) => a.id!);

      await prisma.$transaction(async (tx) => {
        await tx.category.update({ where: { id: d.id }, data: core });
        await tx.categoryTranslation.deleteMany({ where: { categoryId: d.id } });
        await tx.categoryTranslation.createMany({
          data: translations.map((t) => ({ ...t, categoryId: d.id! })),
        });
        // Çıkarılan attribute'ları sil (ProductSpec.attributeId → SetNull).
        await tx.categorySpecAttribute.deleteMany({
          where: { categoryId: id, id: { notIn: keepIds.length ? keepIds : ["__none__"] } },
        });
        for (const a of attrs) {
          if (a.id && existingIds.has(a.id)) {
            await tx.categorySpecAttribute.update({
              where: { id: a.id },
              data: { name: a.name, type: a.type, unit: a.unit, required: a.required, order: a.order },
            });
          } else {
            await tx.categorySpecAttribute.create({
              data: {
                categoryId: id,
                name: a.name,
                type: a.type,
                unit: a.unit,
                required: a.required,
                order: a.order,
              },
            });
          }
        }
      });
    } else {
      const created = await prisma.category.create({
        data: {
          ...core,
          translations: { create: translations },
          specAttributes: {
            create: attrs.map(({ name, type, unit, required, order }) => ({
              name,
              type,
              unit,
              required,
              order,
            })),
          },
        },
        select: { id: true },
      });
      id = created.id;
    }
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/urunler");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.join(", ") ?? "";
      if (target.includes("slug")) return { ok: false, error: "Bu slug zaten kullanılıyor." };
      return { ok: false, error: "Bu kod zaten kullanılıyor." };
    }
    return { ok: false, error: "Kaydedilemedi." };
  }
}

const idSchema = z.object({ id: z.string().min(1) });

const moveSchema = z.object({
  id: z.string().min(1),
  dir: z.enum(["up", "down"]),
});

/**
 * Kategoriyi kendi kardeş grubu (aynı parentId) içinde bir üst/alt sıraya taşır.
 * Grup `order` değerleri kanonik sıraya (0..N-1) normalize edilir, ardından taşınan
 * kategori ile komşusunun pozisyonları takas edilir. (parentId, order) üzerinde
 * unique kısıt olmadığı için takas güvenlidir.
 */
export async function moveCategoryOrder(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    dir: formData.get("dir"),
  });
  if (!parsed.success) return;
  const { id, dir } = parsed.data;

  const target = await prisma.category.findUnique({
    where: { id },
    select: { parentId: true },
  });
  if (!target) return;

  const siblings = await prisma.category.findMany({
    where: { parentId: target.parentId },
    orderBy: [{ order: "asc" }, { code: "asc" }],
    select: { id: true, order: true },
  });

  const idx = siblings.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return;

  // Kanonik pozisyonlar (0..N-1), sonra iki kategorinin pozisyonunu takas et.
  const pos = siblings.map((_, i) => i);
  [pos[idx], pos[swapWith]] = [pos[swapWith], pos[idx]];

  const updates = siblings
    .map((c, i) => ({ id: c.id, order: pos[i], changed: c.order !== pos[i] }))
    .filter((c) => c.changed)
    .map((c) =>
      prisma.category.update({ where: { id: c.id }, data: { order: c.order } }),
    );
  if (updates.length === 0) return;

  await prisma.$transaction(updates);

  revalidatePath("/admin/categories");
  revalidatePath("/urunler");
}

// "Başka kategoriden kopyala" — kaynak kategorinin attribute'larını
// yeni (id'siz) editör satırları olarak döndürür.
export async function copyCategorySchema(
  fromCategoryId: string,
): Promise<EditorSpecAttr[]> {
  await verifyAdmin();
  if (!fromCategoryId) return [];
  const attrs = await getCategoryAttributes(fromCategoryId);
  return attrs.map((a, i) => ({
    id: `copy-${i}`,
    name: a.name,
    type: a.type,
    unit: a.unit,
    required: a.required,
  }));
}

export async function toggleCategoryActive(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const cur = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: { isActive: true },
  });
  if (!cur) return;
  await prisma.category.update({
    where: { id: parsed.data.id },
    data: { isActive: !cur.isActive },
  });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<CatDeleteResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false };

  const counts = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: { _count: { select: { products: true, children: true } } },
  });
  if (!counts) return { ok: false };
  if (counts._count.children > 0) return { ok: false, reason: "has-children" };
  if (counts._count.products > 0) return { ok: false, reason: "has-products" };

  await prisma.category.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/categories");
  return { ok: true };
}
