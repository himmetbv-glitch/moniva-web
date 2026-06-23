import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// İndirme sayacını artırır ve PDF'e (R2 servis yolu) yönlendirir.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const cat = await prisma.catalogue.findFirst({
    where: { id, status: "PUBLISHED", fileUrl: { not: null } },
    select: { fileUrl: true },
  });
  if (!cat?.fileUrl) {
    return Response.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }

  // Sayaç artışı — indirmeyi bloklamasın diye await'siz değil; hızlı update.
  await prisma.catalogue.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  return Response.redirect(new URL(cat.fileUrl, req.url), 302);
}
