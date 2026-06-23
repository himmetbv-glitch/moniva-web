"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Locale } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { pageEditorSchema, type PageEditorPayload } from "@/lib/validation/admin-page";

export type PageUpsertResult = { ok: true; id: string } | { ok: false; error: string };
export type PageActionResult = { ok: boolean; error?: string };

function revalidate(slug?: string, id?: string) {
  revalidatePath("/admin/pages");
  if (id) revalidatePath(`/admin/pages/${id}`);
  if (slug) revalidatePath(`/sayfa/${slug}`);
  revalidatePath("/", "layout"); // footer linkleri
}

export async function upsertPage(raw: PageEditorPayload): Promise<PageUpsertResult> {
  await verifyAdmin();

  const parsed = pageEditorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  const translations = Object.entries(d.translations)
    .filter(([, t]) => t.title.trim())
    .map(([locale, t]) => ({
      locale: locale as Locale,
      title: t.title.trim(),
      body: t.body ?? "",
      metaTitle: t.metaTitle?.trim() || null,
      metaDesc: t.metaDesc?.trim() || null,
    }));
  if (translations.length === 0) {
    return { ok: false, error: "En az bir dilde başlık girmelisiniz." };
  }

  const core = {
    slug: d.slug,
    status: d.status,
    showInFooter: d.showInFooter,
    order: d.order,
  };

  try {
    let id: string;
    if (d.id) {
      id = d.id;
      await prisma.$transaction(async (tx) => {
        await tx.page.update({ where: { id: d.id }, data: core });
        await tx.pageTranslation.deleteMany({ where: { pageId: d.id } });
        await tx.pageTranslation.createMany({
          data: translations.map((t) => ({ ...t, pageId: d.id! })),
        });
      });
    } else {
      const created = await prisma.page.create({
        data: { ...core, translations: { create: translations } },
        select: { id: true },
      });
      id = created.id;
    }
    revalidate(d.slug, id);
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Bu slug zaten kullanılıyor." };
    }
    return { ok: false, error: "Kaydedilemedi." };
  }
}

const idSchema = z.object({ id: z.string().min(1) });
const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function setPageStatus(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const cur = await prisma.page.findUnique({
    where: { id: parsed.data.id },
    select: { slug: true },
  });
  if (!cur) return;

  await prisma.page.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  revalidate(cur.slug, parsed.data.id);
}

export async function deletePage(formData: FormData): Promise<PageActionResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false };

  const page = await prisma.page.findUnique({
    where: { id: parsed.data.id },
    select: { slug: true },
  });
  if (!page) return { ok: false };

  await prisma.page.delete({ where: { id: parsed.data.id } });
  revalidate(page.slug);
  return { ok: true };
}
