import { z } from "zod";

const optUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\//.test(v), { error: "http(s):// ile başlamalı." })
  .or(z.literal(""));

const optEmail = z
  .string()
  .trim()
  .max(160)
  .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { error: "Geçersiz e-posta." })
  .or(z.literal(""));

export const settingsSchema = z.object({
  companyName: z.string().trim().min(2, { error: "Firma adı gerekli." }).max(160),
  addressLine: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().email({ error: "Geçerli bir e-posta girin." }).max(160),
  whatsapp: z.string().trim().max(40).default(""),
  linkedinUrl: optUrl,
  xUrl: optUrl,
  youtubeUrl: optUrl,
  instagramUrl: optUrl,
  metaTitleBase: z.string().trim().min(1, { error: "Başlık tabanı gerekli." }).max(80),
  metaDescBase: z.string().trim().max(320).default(""),
  notifyEmail: optEmail,
  careerPositions: z.preprocess(
    (v) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []),
    z.array(z.string().max(80)).min(1, { error: "En az bir pozisyon gerekli." }),
  ),
});

export type SettingsPayload = z.infer<typeof settingsSchema>;
