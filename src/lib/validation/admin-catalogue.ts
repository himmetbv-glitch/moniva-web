import { NewsStatus } from "@prisma/client";
import { z } from "zod";

export const catalogueEditorSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Geçersiz slug (küçük harf, tire)." }),
  title: z.string().trim().min(2, { error: "Başlık gerekli." }).max(200),
  typeId: z.string().min(1, { error: "Tür seçin." }),
  description: z.string().trim().max(2000).default(""),
  version: z.string().trim().max(40).default(""),
  languages: z.array(z.string().trim().min(1).max(8)).max(8).default([]),
  pageCount: z
    .string()
    .trim()
    .regex(/^\d{0,5}$/, { error: "Sayfa sayısı geçersiz." })
    .default(""),
  status: z.enum(NewsStatus),
  featured: z.boolean().default(false),
});

export type CatalogueEditorPayload = z.infer<typeof catalogueEditorSchema>;
