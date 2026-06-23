import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { getInquiryDetail } from "@/lib/admin/inquiries";
import { renderQuotePdf } from "@/lib/admin/pdf/QuotePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Yetkisiz", { status: 403 });
  }

  const { id } = await ctx.params;
  const detail = await getInquiryDetail(id);
  if (!detail) {
    return new Response("Teklif bulunamadı", { status: 404 });
  }

  const pdf = await renderQuotePdf(detail);
  const body = new Uint8Array(pdf);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Teklif-${detail.ref}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
