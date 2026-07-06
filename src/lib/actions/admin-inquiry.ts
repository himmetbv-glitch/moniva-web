"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuoteStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { generateQuoteToken } from "@/lib/quotes/token";

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(QuoteStatus),
});

const noteSchema = z.object({
  id: z.string().min(1),
  note: z.string().max(4000),
});

export async function updateInquiryStatus(formData: FormData): Promise<void> {
  await verifyAdmin();

  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const admin = await verifyAdmin();
  await prisma.quoteRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === QuoteStatus.QUOTED
        ? { quotedAt: new Date(), quotedBy: admin.id }
        : {}),
    },
  });

  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/dashboard");
}

const idSchema = z.object({ id: z.string().min(1) });
const archiveSchema = z.object({
  id: z.string().min(1),
  archived: z.enum(["true", "false"]),
});

export async function setInquiryArchived(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = archiveSchema.safeParse({
    id: formData.get("id"),
    archived: formData.get("archived"),
  });
  if (!parsed.success) return;

  await prisma.quoteRequest.update({
    where: { id: parsed.data.id },
    data: { isArchived: parsed.data.archived === "true" },
  });

  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/dashboard");
}

export async function deleteInquiry(formData: FormData): Promise<void> {
  await verifyAdmin();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  // QuoteRequestItem → onDelete Cascade; kalemler birlikte silinir.
  await prisma.quoteRequest.delete({ where: { id: parsed.data.id } });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/dashboard");
  redirect("/admin/inquiries");
}

export type SaveQuoteResult = { ok: true } | { ok: false; error: string };

const pricingSchema = z.object({
  id: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1).max(100000),
        unitPrice: z.number().min(0).max(10_000_000).nullable(),
      }),
    )
    .min(1),
  discountPct: z.number().min(0).max(100),
  shippingCost: z.number().min(0).max(10_000_000),
  shippingMode: z.string().trim().max(60).nullable(),
  vatRate: z.number().min(0).max(100),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Geçersiz tarih." })
    .nullable(),
  paymentTerms: z.string().trim().max(120).nullable(),
  markQuoted: z.boolean(),
});

export type QuotePricingPayload = z.infer<typeof pricingSchema>;

export async function saveQuotePricing(
  raw: QuotePricingPayload,
): Promise<SaveQuoteResult> {
  const admin = await verifyAdmin();

  const parsed = pricingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const d = parsed.data;

  // "Teklif gönder" için her kalemde birim fiyat zorunlu.
  if (d.markQuoted && d.items.some((it) => it.unitPrice == null || it.unitPrice <= 0)) {
    return { ok: false, error: "Teklif göndermek için tüm kalemlere birim fiyat girin." };
  }

  // Kalemlerin bu talebe ait olduğunu doğrula (yetki/tutarlılık).
  const owned = await prisma.quoteRequestItem.findMany({
    where: { quoteRequestId: d.id },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((o) => o.id));
  if (d.items.some((it) => !ownedIds.has(it.id))) {
    return { ok: false, error: "Geçersiz kalem." };
  }

  const validUntil = d.validUntil ? new Date(`${d.validUntil}T00:00:00`) : null;

  try {
    await prisma.$transaction(async (tx) => {
      for (const it of d.items) {
        await tx.quoteRequestItem.update({
          where: { id: it.id },
          data: { quantity: it.quantity, unitPrice: it.unitPrice },
        });
      }
      // "Teklif gönder" → izlenebilir link için publicToken + sentAt üret
      // (varsa yeniden üretme; re-send'de token sabit kalsın).
      const cur = d.markQuoted
        ? await tx.quoteRequest.findUnique({
            where: { id: d.id },
            select: { publicToken: true, sentAt: true },
          })
        : null;

      await tx.quoteRequest.update({
        where: { id: d.id },
        data: {
          discountPct: d.discountPct,
          shippingCost: d.shippingCost,
          shippingMode: d.shippingMode || null,
          vatRate: d.vatRate,
          validUntil,
          paymentTerms: d.paymentTerms || null,
          ...(d.markQuoted
            ? {
                status: QuoteStatus.QUOTED,
                quotedAt: new Date(),
                quotedBy: admin.id,
                publicToken: cur?.publicToken ?? generateQuoteToken(),
                sentAt: cur?.sentAt ?? new Date(),
              }
            : {}),
        },
      });
    });
  } catch {
    return { ok: false, error: "Kaydedilemedi." };
  }

  revalidatePath(`/admin/inquiries/${d.id}`);
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function saveInquiryNote(formData: FormData): Promise<void> {
  await verifyAdmin();

  const parsed = noteSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note"),
  });
  if (!parsed.success) return;

  await prisma.quoteRequest.update({
    where: { id: parsed.data.id },
    data: { notes_admin: parsed.data.note.trim() || null },
  });

  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
}
