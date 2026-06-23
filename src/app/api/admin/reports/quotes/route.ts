import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_TR: Record<string, string> = {
  NEW: "Yeni",
  QUOTED: "Teklif verildi",
  CLOSED: "Kapandı",
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Yetkisiz", { status: 403 });
  }

  const rows = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      companyName: true,
      fullName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      taxNumber: true,
      _count: { select: { items: true } },
    },
  });

  const header = [
    "Referans", "Tarih", "Durum", "Firma", "Ad Soyad",
    "E-posta", "Telefon", "Ülke", "Şehir", "VKN", "Kalem",
  ];

  const lines = [header.map(csvCell).join(";")];
  for (const r of rows) {
    lines.push(
      [
        `QR-${r.id.slice(-6).toUpperCase()}`,
        dateFmt.format(r.createdAt),
        STATUS_TR[r.status] ?? r.status,
        r.companyName,
        r.fullName,
        r.email,
        r.phone,
        r.country,
        r.city ?? "",
        r.taxNumber ?? "",
        r._count.items,
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
      "Content-Disposition": `attachment; filename="moniva-teklif-raporu-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
