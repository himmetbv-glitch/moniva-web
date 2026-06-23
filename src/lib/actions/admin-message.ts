"use server";

import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin/dal";

const schema = z.object({
  kind: z.enum(["contact", "application"]),
  id: z.string().min(1),
  status: z.enum(SubmissionStatus),
});

export async function updateMessageStatus(formData: FormData): Promise<void> {
  await verifyAdmin();

  const parsed = schema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { kind, id, status } = parsed.data;

  if (kind === "contact") {
    await prisma.contactMessage.update({ where: { id }, data: { status } });
    revalidatePath(`/admin/messages/contact/${id}`);
  } else {
    await prisma.jobApplication.update({ where: { id }, data: { status } });
    revalidatePath(`/admin/messages/application/${id}`);
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
}
