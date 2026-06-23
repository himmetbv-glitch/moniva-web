"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";
import { getImportLookups } from "@/lib/admin/import-options";
import { validateRow, type RawRow, type NormalizedRow } from "@/lib/admin/product-import";
import { normalizeOem } from "@/lib/products/normalize-oem";

export type ImportMode = "skip" | "update";

export type ImportError = { row: number; sku: string; message: string };

export type ImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportError[];
};

const MAX_ROWS = 2000;

function buildTranslations(n: NormalizedRow) {
  const out: {
    locale: Locale;
    name: string;
    description: string;
    shortDesc: string | null;
  }[] = [];
  for (const [locale, t] of Object.entries(n.translations)) {
    if (!t?.name) continue;
    out.push({
      locale: locale as Locale,
      name: t.name,
      description: t.description ?? "",
      shortDesc: t.shortDesc?.trim() || null,
    });
  }
  return out;
}

function buildOem(n: NormalizedRow) {
  const seen = new Set<string>();
  return n.oem
    .filter((o) => o.oemNumber && !seen.has(o.oemNumber) && seen.add(o.oemNumber))
    .map((o) => ({
      oemNumber: o.oemNumber,
      oemNumberNormalized: normalizeOem(o.oemNumber),
      manufacturer: o.manufacturer || null,
    }));
}

export async function importProducts(
  rawRows: RawRow[],
  mode: ImportMode,
): Promise<ImportResult> {
  await verifyAdmin();

  const rows = rawRows.slice(0, MAX_ROWS);
  const lookups = await getImportLookups();

  const result: ImportResult = {
    total: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const v = validateRow(rows[i], lookups);
    if (!v.ok) {
      result.failed++;
      result.errors.push({
        row: i + 2, // 1=başlık satırı
        sku: (rows[i].sku ?? "").toString(),
        message: v.errors.join("; "),
      });
      continue;
    }

    const n = v.data;
    const core = {
      slug: n.slug,
      material: n.material || null,
      partType: n.partType,
      categoryId: n.categoryId,
      brandId: n.brandId,
      isActive: n.isActive,
      isFeatured: n.isFeatured,
    };
    const translations = buildTranslations(n);
    const specs = n.specs.map((s, idx) => ({ ...s, unit: null, order: idx }));
    const oem = buildOem(n);

    try {
      const existing = await prisma.product.findUnique({
        where: { sku: n.sku },
        select: { id: true },
      });

      if (existing) {
        if (mode === "skip") {
          result.skipped++;
          continue;
        }
        await prisma.$transaction(async (tx) => {
          await tx.product.update({ where: { id: existing.id }, data: core });
          await tx.productTranslation.deleteMany({ where: { productId: existing.id } });
          await tx.productSpec.deleteMany({ where: { productId: existing.id } });
          await tx.oemReference.deleteMany({ where: { productId: existing.id } });
          if (translations.length)
            await tx.productTranslation.createMany({
              data: translations.map((t) => ({ ...t, productId: existing.id })),
            });
          if (specs.length)
            await tx.productSpec.createMany({
              data: specs.map((s) => ({ ...s, productId: existing.id })),
            });
          if (oem.length)
            await tx.oemReference.createMany({
              data: oem.map((o) => ({ ...o, productId: existing.id })),
            });
        });
        result.updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: n.sku,
            ...core,
            translations: { create: translations },
            specs: { create: specs },
            oemReferences: { create: oem },
          },
        });
        result.created++;
      }
    } catch (e) {
      result.failed++;
      let msg = "Kaydedilemedi";
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = (e.meta?.target as string[] | undefined)?.join(", ") ?? "";
        msg = target.includes("slug") ? "Slug zaten kullanılıyor" : "Çakışma (benzersiz alan)";
      }
      result.errors.push({ row: i + 2, sku: n.sku, message: msg });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/urunler");
  return result;
}
