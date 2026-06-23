import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { isR2Configured, putObject } from "@/lib/r2/client";
import { notifyNewApplication } from "@/lib/email/notify";
import { getSettings } from "@/lib/settings";
import {
  jobApplicationSchema,
  CV_EXT,
  CV_MAX_BYTES,
} from "@/lib/validation/job-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = jobApplicationSchema.safeParse({
    fullName: form.get("fullName"),
    email: form.get("email"),
    phone: form.get("phone"),
    location: form.get("location") ?? "",
    position: form.get("position"),
    experience: form.get("experience") ?? "",
    linkedinUrl: form.get("linkedinUrl") ?? "",
    coverNote: form.get("coverNote"),
    kvkkConsent: form.get("kvkkConsent") === "true",
  });
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Form hatalı." },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Pozisyon, Ayarlar'daki güncel listede olmalı (dropdown dışı POST'a karşı).
  const { careerPositions } = await getSettings();
  if (!careerPositions.includes(d.position)) {
    return Response.json({ error: "Geçersiz pozisyon seçimi." }, { status: 422 });
  }

  // CV zorunlu
  const cv = form.get("cv");
  if (!(cv instanceof File) || cv.size === 0) {
    return Response.json({ error: "Lütfen CV dosyanızı ekleyin." }, { status: 422 });
  }
  const ext = CV_EXT[cv.type];
  if (!ext) {
    return Response.json(
      { error: "CV formatı PDF, DOC veya DOCX olmalı." },
      { status: 415 },
    );
  }
  if (cv.size > CV_MAX_BYTES) {
    return Response.json({ error: "CV 5 MB sınırını aşıyor." }, { status: 413 });
  }
  if (!isR2Configured()) {
    return Response.json({ error: "Dosya servisi yapılandırılmamış." }, { status: 503 });
  }

  const cvKey = `applications/${randomUUID()}.${ext}`;
  try {
    await putObject(cvKey, new Uint8Array(await cv.arrayBuffer()), cv.type);
  } catch {
    return Response.json({ error: "CV yüklenemedi." }, { status: 502 });
  }

  await prisma.jobApplication.create({
    data: {
      fullName: d.fullName,
      email: d.email,
      phone: d.phone,
      location: d.location || null,
      position: d.position,
      experience: d.experience || null,
      linkedinUrl: d.linkedinUrl || null,
      coverNote: d.coverNote,
      cvKey,
      cvFileName: cv.name.slice(0, 200),
      kvkkConsent: d.kvkkConsent,
    },
  });

  await notifyNewApplication({
    fullName: d.fullName,
    email: d.email,
    phone: d.phone,
    position: d.position,
    experience: d.experience || null,
  });

  return Response.json({ ok: true });
}
