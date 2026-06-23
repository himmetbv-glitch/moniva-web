"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { savePageSchema, parseSectionData } from "@/lib/validation/managed-page";

export type ManagedPageResult = { ok: true } | { ok: false; error: string };

function revalidate(path: string, key: string) {
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/site/${key}`);
  if (path === "/") revalidatePath("/", "layout");
  else revalidatePath(path);
}

export async function saveManagedPage(raw: unknown): Promise<ManagedPageResult> {
  await verifyAdmin();

  const parsed = savePageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  const page = await prisma.managedPage.findUnique({
    where: { key: d.key },
    include: { sections: { select: { id: true, key: true, type: true, name: true } } },
  });
  if (!page) return { ok: false, error: "Sayfa bulunamadı." };

  const byKey = new Map(page.sections.map((s) => [s.key, s]));

  // Tip DB'den; veriyi o tipin şemasına göre doğrula.
  const updates: { id: string; data: Prisma.InputJsonValue; order: number; visible: boolean }[] = [];
  for (const incoming of d.sections) {
    const existing = byKey.get(incoming.key);
    if (!existing) continue; // bilinmeyen bölüm — yok say
    try {
      const cleanData = parseSectionData(existing.type, incoming.data) as Prisma.InputJsonValue;
      updates.push({
        id: existing.id,
        data: cleanData,
        order: incoming.order,
        visible: incoming.visible,
      });
    } catch (e) {
      const msg = e instanceof z.ZodError ? e.issues[0]?.message : null;
      return { ok: false, error: `"${existing.name}" bölümü geçersiz${msg ? `: ${msg}` : ""}.` };
    }
  }

  try {
    await prisma.$transaction([
      prisma.managedPage.update({
        where: { key: d.key },
        data: {
          status: d.status,
          seoTitle: d.seoTitle?.trim() || null,
          seoDesc: d.seoDesc?.trim() || null,
          canonical: d.canonical?.trim() || null,
        },
      }),
      ...updates.map((u) =>
        prisma.pageSection.update({
          where: { id: u.id },
          data: { data: u.data, order: u.order, visible: u.visible },
        }),
      ),
    ]);
  } catch {
    return { ok: false, error: "Kaydedilemedi." };
  }

  revalidate(page.path, d.key);
  return { ok: true };
}

const statusSchema = z.object({
  key: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function setManagedPageStatus(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = statusSchema.safeParse({
    key: formData.get("key"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const page = await prisma.managedPage.findUnique({
    where: { key: parsed.data.key },
    select: { path: true },
  });
  if (!page) return;

  await prisma.managedPage.update({
    where: { key: parsed.data.key },
    data: { status: parsed.data.status },
  });
  revalidate(page.path, parsed.data.key);
}
