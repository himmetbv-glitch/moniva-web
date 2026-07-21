import { SpecType } from "@prisma/client";
import { z } from "zod";

const localeKey = z.enum(["TR", "EN", "RU", "AR"]);

const specAttrSchema = z.object({
  id: z.string().optional(), // mevcut attribute id'si; yeni satırda "new-*" veya yok
  name: z.string().trim().min(1, { error: "Özellik adı gerekli." }).max(80),
  type: z.enum(SpecType),
  unit: z.string().trim().max(20).default(""),
  required: z.boolean().default(false),
});

export const categoryEditorSchema = z.object({
  id: z.string().optional(),
  // Boş bırakılabilir → server benzersiz kod üretir. Elle girilirse format zorunlu.
  code: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[A-Z0-9]{2,8}$/.test(v), {
      error: "Kod 2-8 büyük harf/rakam olmalı (örn. AS).",
    })
    .default(""),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Geçersiz slug." }),
  parentId: z.string().default(""),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  image: z.string().trim().max(500).default(""),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  translations: z.record(
    localeKey,
    z.object({
      name: z.string().trim().max(120).default(""),
      metaTitle: z.string().trim().max(120).default(""),
      metaDesc: z.string().trim().max(320).default(""),
    }),
  ),
  specAttributes: z.array(specAttrSchema).max(60).default([]),
});

export type CategoryEditorPayload = z.infer<typeof categoryEditorSchema>;
