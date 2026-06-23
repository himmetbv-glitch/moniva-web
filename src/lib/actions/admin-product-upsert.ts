"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { normalizeOem } from "@/lib/products/normalize-oem";
import {
  productEditorSchema,
  type ProductEditorPayload,
} from "@/lib/validation/admin-product";

export type UpsertResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type TranslationCreate = {
  locale: Locale;
  name: string;
  description: string;
  shortDesc: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
};

function buildTranslations(payload: ProductEditorPayload): TranslationCreate[] {
  const out: TranslationCreate[] = [];
  for (const [locale, t] of Object.entries(payload.translations)) {
    if (!t.name.trim()) continue; // name zorunlu — boşsa o dili kaydetme
    out.push({
      locale: locale as Locale,
      name: t.name.trim(),
      description: t.description ?? "",
      shortDesc: t.shortDesc?.trim() || null,
      metaTitle: t.metaTitle?.trim() || null,
      metaDesc: t.metaDesc?.trim() || null,
    });
  }
  return out;
}

function buildSpecs(payload: ProductEditorPayload) {
  return payload.specs
    .filter((s) => s.key.trim() && s.value.trim())
    .map((s, i) => ({
      attributeId: s.attributeId || null,
      key: s.key.trim(),
      value: s.value.trim(),
      unit: s.unit.trim() || null,
      order: i,
    }));
}

function buildOem(payload: ProductEditorPayload) {
  const seen = new Set<string>();
  const out: {
    oemNumber: string;
    oemNumberNormalized: string;
    manufacturer: string | null;
  }[] = [];
  for (const o of payload.oem) {
    const num = o.oemNumber.trim();
    if (!num || seen.has(num)) continue;
    seen.add(num);
    out.push({
      oemNumber: num,
      oemNumberNormalized: normalizeOem(num),
      manufacturer: o.manufacturer.trim() || null,
    });
  }
  return out;
}

export async function upsertProduct(
  raw: ProductEditorPayload,
): Promise<UpsertResult> {
  await verifyAdmin();

  const parsed = productEditorSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Geçersiz veri." };
  }
  const data = parsed.data;

  const translations = buildTranslations(data);
  if (translations.length === 0) {
    return { ok: false, error: "En az bir dilde ürün adı girmelisiniz." };
  }
  const specs = buildSpecs(data);
  const oem = buildOem(data);

  const core = {
    sku: data.sku,
    slug: data.slug,
    material: data.material.trim() || null,
    partType: data.partType,
    categoryId: data.categoryId,
    brandId: data.brandId || null,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
  };

  try {
    let productId: string;

    if (data.id) {
      productId = data.id;
      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id: data.id }, data: core });
        await tx.productTranslation.deleteMany({ where: { productId: data.id } });
        await tx.productSpec.deleteMany({ where: { productId: data.id } });
        await tx.oemReference.deleteMany({ where: { productId: data.id } });
        await tx.productTranslation.createMany({
          data: translations.map((t) => ({ ...t, productId: data.id! })),
        });
        if (specs.length)
          await tx.productSpec.createMany({
            data: specs.map((s) => ({ ...s, productId: data.id! })),
          });
        if (oem.length)
          await tx.oemReference.createMany({
            data: oem.map((o) => ({ ...o, productId: data.id! })),
          });
      });
    } else {
      const created = await prisma.product.create({
        data: {
          ...core,
          translations: { create: translations },
          specs: { create: specs },
          oemReferences: { create: oem },
        },
        select: { id: true },
      });
      productId = created.id;
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/urunler");
    return { ok: true, id: productId };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.join(", ") ?? "";
      if (target.includes("slug"))
        return { ok: false, error: "Bu slug zaten kullanılıyor." };
      return { ok: false, error: "Bu SKU zaten kullanılıyor." };
    }
    return { ok: false, error: "Kaydedilemedi. Lütfen tekrar deneyin." };
  }
}
