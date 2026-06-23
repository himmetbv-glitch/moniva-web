"use server";

import { revalidatePath } from "next/cache";
import { Prisma, NewsStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { deleteObject, keyFromAssetUrl } from "@/lib/r2/client";
import {
  catalogueEditorSchema,
  type CatalogueEditorPayload,
} from "@/lib/validation/admin-catalogue";

export type CatalogueUpsertResult = { ok: true; id: string } | { ok: false; error: string };
export type CatalogueActionResult = { ok: boolean; error?: string };

function revalidate(id?: string) {
  revalidatePath("/admin/catalogues");
  if (id) revalidatePath(`/admin/catalogues/${id}`);
  revalidatePath("/kataloglar");
}

export async function upsertCatalogue(
  raw: CatalogueEditorPayload,
): Promise<CatalogueUpsertResult> {
  await verifyAdmin();

  const parsed = catalogueEditorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;
  const pageCount = d.pageCount ? parseInt(d.pageCount, 10) : null;

  // Yayınlamak için PDF şart (dosya edit modunda ayrıca yüklenir).
  if (d.status === NewsStatus.PUBLISHED) {
    const hasFile = d.id
      ? Boolean(
          (
            await prisma.catalogue.findUnique({
              where: { id: d.id },
              select: { fileUrl: true },
            })
          )?.fileUrl,
        )
      : false;
    if (!hasFile) {
      return {
        ok: false,
        error: "Yayınlamak için önce PDF yükleyin. Taslak olarak kaydedip dosyayı ekleyin.",
      };
    }
  }

  const core = {
    slug: d.slug,
    title: d.title,
    typeId: d.typeId,
    description: d.description?.trim() || null,
    version: d.version?.trim() || null,
    languages: d.languages,
    pageCount,
    status: d.status,
    featured: d.featured,
  };

  try {
    let id: string;
    if (d.id) {
      await prisma.catalogue.update({ where: { id: d.id }, data: core });
      id = d.id;
    } else {
      const created = await prisma.catalogue.create({ data: core, select: { id: true } });
      id = created.id;
    }
    revalidate(id);
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Bu slug zaten kullanılıyor." };
    }
    return { ok: false, error: "Kaydedilemedi." };
  }
}

const idSchema = z.object({ id: z.string().min(1) });
const statusSchema = z.object({ id: z.string().min(1), status: z.enum(NewsStatus) });

export async function setCatalogueStatus(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const cur = await prisma.catalogue.findUnique({
    where: { id: parsed.data.id },
    select: { fileUrl: true },
  });
  if (!cur) return;
  // Dosyasız katalog yayınlanamaz.
  if (parsed.data.status === NewsStatus.PUBLISHED && !cur.fileUrl) return;

  await prisma.catalogue.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  revalidate(parsed.data.id);
}

export async function toggleCatalogueFeatured(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const cur = await prisma.catalogue.findUnique({
    where: { id: parsed.data.id },
    select: { featured: true },
  });
  if (!cur) return;
  await prisma.catalogue.update({
    where: { id: parsed.data.id },
    data: { featured: !cur.featured },
  });
  revalidate(parsed.data.id);
}

export async function deleteCatalogue(formData: FormData): Promise<CatalogueActionResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false };

  const cat = await prisma.catalogue.findUnique({
    where: { id: parsed.data.id },
    select: { fileUrl: true, coverImage: true },
  });
  if (!cat) return { ok: false };

  await prisma.catalogue.delete({ where: { id: parsed.data.id } });

  // R2 dosyalarını temizle (yetim obje bırakma).
  for (const url of [cat.fileUrl, cat.coverImage]) {
    if (!url) continue;
    const key = keyFromAssetUrl(url);
    if (key) {
      try {
        await deleteObject(key);
      } catch {
        /* sessiz geç */
      }
    }
  }

  revalidate();
  return { ok: true };
}
