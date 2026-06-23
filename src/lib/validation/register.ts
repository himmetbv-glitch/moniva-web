import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().trim().min(2, { error: "Firma adı gerekli." }).max(160),
  fullName: z.string().trim().min(2, { error: "Ad soyad gerekli." }).max(120),
  email: z.email({ error: "Geçerli bir e-posta girin." }).trim().toLowerCase(),
  phone: z.string().trim().min(5, { error: "Telefon gerekli." }).max(40),
  country: z.string().trim().min(2, { error: "Ülke gerekli." }).max(60),
  city: z.string().trim().min(2, { error: "İl/şehir gerekli." }).max(60),
  address: z.string().trim().min(5, { error: "Firma adresi gerekli." }).max(250),
  taxNumber: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, { error: "VKN 10 (veya TCKN 11) haneli olmalı." })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, { error: "Şifre en az 8 karakter olmalı." })
    .max(100),
  kvkkConsent: z.literal("on", { error: "KVKK onayı gerekli." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
