import { NewsStatus, type Locale } from "@prisma/client";
import { z } from "zod";

const trSchema = z.object({
  title: z.string().trim().max(200).default(""),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().max(40000).default(""),
  metaTitle: z.string().trim().max(200).default(""),
  metaDesc: z.string().trim().max(400).default(""),
});

export const newsEditorSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Geçersiz slug (küçük harf, tire)." }),
  status: z.enum(NewsStatus),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Geçersiz tarih." })
    .or(z.literal("")),
  translations: z.record(z.string(), trSchema),
});

export type NewsEditorPayload = z.infer<typeof newsEditorSchema>;
export type NewsEditorTranslations = Record<Locale, z.infer<typeof trSchema>>;
