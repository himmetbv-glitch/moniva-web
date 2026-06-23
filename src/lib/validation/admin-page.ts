import { NewsStatus, type Locale } from "@prisma/client";
import { z } from "zod";

const trSchema = z.object({
  title: z.string().trim().max(200).default(""),
  body: z.string().max(60000).default(""),
  metaTitle: z.string().trim().max(200).default(""),
  metaDesc: z.string().trim().max(400).default(""),
});

export const pageEditorSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Geçersiz slug (küçük harf, tire)." }),
  status: z.enum(NewsStatus),
  showInFooter: z.boolean(),
  order: z.number().int().min(0).max(9999),
  translations: z.record(z.string(), trSchema),
});

export type PageEditorPayload = z.infer<typeof pageEditorSchema>;
export type PageEditorTranslations = Record<Locale, z.infer<typeof trSchema>>;
