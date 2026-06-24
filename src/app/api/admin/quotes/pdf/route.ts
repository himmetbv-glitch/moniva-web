import type { NextRequest } from "next/server";
import { QuoteStatus } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { computeQuoteTotals } from "@/lib/admin/quote-pricing";
import { renderQuotePdf, type QuotePdfData } from "@/lib/admin/pdf/QuotePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const itemSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(300),
  oem: z.string().trim().max(200).nullable().default(null),
  quantity: z.number().int().min(1).max(100000),
  unitPrice: z.number().min(0).max(10_000_000),
});

const schema = z.object({
  customer: z.object({
    companyName: z.string().trim().max(200),
    fullName: z.string().trim().max(200),
    phone: z.string().trim().max(60),
    email: z.string().trim().max(200),
    country: z.string().trim().max(100),
    city: z.string().trim().max(100),
    taxNumber: z.string().trim().max(40),
    taxOffice: z.string().trim().max(120),
    address: z.string().trim().max(500),
  }),
  items: z.array(itemSchema).min(1).max(200),
  currency: z.enum(["TRY", "USD", "EUR"]),
  discountPct: z.number().min(0).max(100),
  shippingCost: z.number().min(0).max(10_000_000),
  shippingMode: z.string().trim().max(60),
  vatRate: z.number().min(0).max(100),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  paymentTerms: z.string().trim().max(120),
  note: z.string().trim().max(2000).default(""),
});

const TZ = "Europe/Istanbul";
const dateLabelFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

function buildRef(now: Date): string {
  // YYMMDD-HHMM in Turkey time → human-readable, no DB sequence needed.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  })
    .format(now)
    .replace(/-/g, "")
    .slice(2);
  const hm = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  })
    .format(now)
    .replace(":", "");
  return `TKL-${ymd}-${hm}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Yetkisiz", { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Geçersiz istek", { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response("Geçersiz veri", { status: 400 });
  }
  const q = parsed.data;
  const c = q.customer;

  const items = q.items.map((it, i) => ({
    id: String(i),
    sku: it.sku,
    name: it.name,
    oem: it.oem,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
  }));

  const totals = computeQuoteTotals(
    items.map((it) => ({ quantity: it.quantity, unitPrice: it.unitPrice })),
    { discountPct: q.discountPct, shippingCost: q.shippingCost, vatRate: q.vatRate },
  );

  const now = new Date();
  const ref = buildRef(now);
  const validUntilLabel = q.validUntil
    ? dateLabelFmt.format(new Date(`${q.validUntil}T00:00:00`))
    : null;

  const data: QuotePdfData = {
    ref,
    status: QuoteStatus.QUOTED,
    currency: q.currency,
    createdAtLabel: dateLabelFmt.format(now),
    quotedAtLabel: null,
    companyName: c.companyName || "—",
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    country: c.country,
    city: c.city || null,
    taxNumber: c.taxNumber || null,
    taxOffice: c.taxOffice || null,
    address: c.address,
    shippingMode: q.shippingMode || null,
    paymentTerms: q.paymentTerms || null,
    validUntil: validUntilLabel,
    discountPct: q.discountPct,
    vatRate: q.vatRate,
    pdfNote: q.note || undefined,
    items,
    totals,
  };

  const pdf = await renderQuotePdf(data);
  const out = new Uint8Array(pdf);

  return new Response(out, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Teklif-${ref}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
