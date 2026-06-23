import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, pickTranslation } from "@/lib/i18n";
import { buildProductWhere } from "@/lib/admin/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Yetkisiz", { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const where = buildProductWhere({
    q: sp.get("q") ?? undefined,
    status: status === "active" || status === "inactive" ? status : undefined,
    featured: sp.get("status") === "featured" || sp.get("featured") === "1",
    kategori: sp.get("kategori") ?? undefined,
  });

  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { sku: "asc" }],
    select: {
      sku: true,
      slug: true,
      partType: true,
      isActive: true,
      isFeatured: true,
      sortOrder: true,
      translations: { select: { locale: true, name: true } },
      category: { select: { slug: true, translations: { select: { locale: true, name: true } } } },
      brand: { select: { name: true } },
      _count: { select: { oemReferences: true } },
    },
  });

  const header = [
    "Referans (SKU)", "Ürün Adı", "Slug", "Kategori", "Marka",
    "Tür", "OEM Sayısı", "Durum", "Öne Çıkan", "Sıra",
  ];

  const lines = [header.map(csvCell).join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.sku,
        pickTranslation(r.translations, DEFAULT_LOCALE)?.name ?? "",
        r.slug,
        pickTranslation(r.category.translations, DEFAULT_LOCALE)?.name ?? r.category.slug,
        r.brand?.name ?? "",
        r.partType,
        r._count.oemReferences,
        r.isActive ? "Aktif" : "Pasif",
        r.isFeatured ? "Evet" : "Hayır",
        r.sortOrder,
      ]
        .map(csvCell)
        .join(";"),
    );
  }

  // BOM → Excel'de Türkçe karakterler doğru görünür.
  const csv = "﻿" + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moniva-urunler-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
