"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";

export type BrandUpsertResult = { ok: true; id: string } | { ok: false; error: string };
export type BrandDeleteResult = { ok: boolean; reason?: "has-products" };

const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { error: "Marka adı gerekli." }).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Geçersiz slug." }),
  website: z.string().trim().max(200).default(""),
  logoUrl: z.string().trim().max(400).default(""),
  isActive: z.boolean().default(true),
});

export type BrandPayload = z.infer<typeof brandSchema>;

export async function upsertBrand(raw: BrandPayload): Promise<BrandUpsertResult> {
  await verifyAdmin();
  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;
  const data = {
    name: d.name,
    slug: d.slug,
    website: d.website || null,
    logoUrl: d.logoUrl || null,
    isActive: d.isActive,
  };

  try {
    let id: string;
    if (d.id) {
      id = d.id;
      await prisma.brand.update({ where: { id: d.id }, data });
    } else {
      const created = await prisma.brand.create({ data, select: { id: true } });
      id = created.id;
    }
    revalidatePath("/admin/brands");
    revalidatePath("/urunler");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.join(", ") ?? "";
      if (target.includes("slug")) return { ok: false, error: "Bu slug zaten kullanılıyor." };
      return { ok: false, error: "Bu marka adı zaten kullanılıyor." };
    }
    return { ok: false, error: "Kaydedilemedi." };
  }
}

const idSchema = z.object({ id: z.string().min(1) });

export async function deleteBrand(formData: FormData): Promise<BrandDeleteResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false };

  const count = await prisma.product.count({ where: { brandId: parsed.data.id } });
  if (count > 0) return { ok: false, reason: "has-products" };

  await prisma.brand.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/brands");
  return { ok: true };
}
