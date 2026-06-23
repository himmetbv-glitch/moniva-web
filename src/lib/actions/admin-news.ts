"use server";

import { revalidatePath } from "next/cache";
import { Prisma, NewsStatus, type Locale } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { deleteObject, keyFromAssetUrl } from "@/lib/r2/client";
import { newsEditorSchema, type NewsEditorPayload } from "@/lib/validation/admin-news";

export type NewsUpsertResult = { ok: true; id: string } | { ok: false; error: string };
export type NewsActionResult = { ok: boolean; error?: string };

function revalidate(id?: string) {
  revalidatePath("/admin/news");
  if (id) revalidatePath(`/admin/news/${id}`);
  revalidatePath("/haberler", "layout");
}

export async function upsertNews(raw: NewsEditorPayload): Promise<NewsUpsertResult> {
  await verifyAdmin();

  const parsed = newsEditorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  const translations = Object.entries(d.translations)
    .filter(([, t]) => t.title.trim())
    .map(([locale, t]) => ({
      locale: locale as Locale,
      title: t.title.trim(),
      excerpt: t.excerpt?.trim() || null,
      body: t.body ?? "",
      metaTitle: t.metaTitle?.trim() || null,
      metaDesc: t.metaDesc?.trim() || null,
    }));
  if (translations.length === 0) {
    return { ok: false, error: "En az bir dilde başlık girmelisiniz." };
  }

  let publishedAt: Date | null = null;
  if (d.publishedAt) {
    publishedAt = new Date(`${d.publishedAt}T00:00:00`);
  } else if (d.status === NewsStatus.PUBLISHED) {
    publishedAt = new Date();
  }

  const core = { slug: d.slug, status: d.status, publishedAt };

  try {
    let id: string;
    if (d.id) {
      id = d.id;
      await prisma.$transaction(async (tx) => {
        await tx.newsPost.update({ where: { id: d.id }, data: core });
        await tx.newsPostTranslation.deleteMany({ where: { newsPostId: d.id } });
        await tx.newsPostTranslation.createMany({
          data: translations.map((t) => ({ ...t, newsPostId: d.id! })),
        });
      });
    } else {
      const created = await prisma.newsPost.create({
        data: { ...core, translations: { create: translations } },
        select: { id: true },
      });
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

export async function setNewsStatus(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const cur = await prisma.newsPost.findUnique({
    where: { id: parsed.data.id },
    select: { publishedAt: true },
  });
  if (!cur) return;

  await prisma.newsPost.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === NewsStatus.PUBLISHED && !cur.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    },
  });
  revalidate(parsed.data.id);
}

export async function deleteNews(formData: FormData): Promise<NewsActionResult> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false };

  const post = await prisma.newsPost.findUnique({
    where: { id: parsed.data.id },
    select: { coverImage: true },
  });
  if (!post) return { ok: false };

  await prisma.newsPost.delete({ where: { id: parsed.data.id } });

  if (post.coverImage) {
    const key = keyFromAssetUrl(post.coverImage);
    if (key) {
      try {
        await deleteObject(key);
      } catch {
        /* yetim obje — sessiz geç */
      }
    }
  }

  revalidate();
  return { ok: true };
}
