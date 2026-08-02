import { z } from "zod";

const localeKey = z.enum(["TR", "EN", "RU", "AR"]);

const translationSchema = z.object({
  name: z.string().trim().max(120).default(""),
  shortDesc: z.string().trim().max(400).default(""),
  description: z.string().trim().max(8000).default(""),
  metaTitle: z.string().trim().max(120).default(""),
  metaDesc: z.string().trim().max(320).default(""),
});

export const productEditorSchema = z.object({
  id: z.string().optional(),
  // Gerçek Moniva stok kodları (örn. 97.1350.200.51) veya eski MNV-* biçimi.
  sku: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9 ./-]{1,39}$/, {
      error: "SKU 2-40 karakter olmalı; harf, rakam, nokta, tire ve / kullanılabilir.",
    }),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "Slug yalnızca küçük harf, rakam ve tire içerebilir.",
    }),
  material: z.string().trim().max(80).default(""),
  partType: z.enum(["OEM", "AFTERMARKET"]),
  categoryId: z.string().min(1, { error: "Kategori seçmelisiniz." }),
  brandId: z.string().default(""),
  isActive: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  translations: z.record(localeKey, translationSchema),
  specs: z
    .array(
      z.object({
        attributeId: z.string().nullable().default(null),
        key: z.string().trim().max(120),
        value: z.string().trim().max(400),
        unit: z.string().trim().max(40).default(""),
      }),
    )
    .default([]),
  oem: z
    .array(
      z.object({
        manufacturer: z.string().trim().max(80).default(""),
        oemNumber: z.string().trim().max(120),
      }),
    )
    .default([]),
});

export type ProductEditorPayload = z.infer<typeof productEditorSchema>;
