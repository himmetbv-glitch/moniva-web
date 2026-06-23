import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { notifyNewContact } from "@/lib/email/notify";
import { contactMessageSchema } from "@/lib/validation/contact-message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Form hatalı." },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Şemada ayrı alan olmayan bilgileri mesaja iliştir (veri kaybı olmasın).
  const extra: string[] = [`Ülke: ${d.country}`];
  if (d.oemRefs) extra.push(`OEM referansları: ${d.oemRefs}`);
  const message = `${d.message}\n\n— ${extra.join(" · ")}`;

  const fullName = `${d.firstName} ${d.lastName}`;
  await prisma.contactMessage.create({
    data: {
      fullName,
      email: d.email,
      phone: d.phone || null,
      company: d.company || null,
      subject: d.topic,
      message,
      kvkkConsent: d.kvkkConsent,
    },
  });

  await notifyNewContact({
    fullName,
    email: d.email,
    phone: d.phone || null,
    company: d.company || null,
    subject: d.topic,
    message,
  });

  return Response.json({ ok: true });
}
