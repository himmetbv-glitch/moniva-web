import { z } from "zod";

export const profileSchema = z.object({
  companyName: z.string().trim().min(2, { error: "Firma adı gerekli." }).max(160),
  fullName: z.string().trim().min(2, { error: "Ad soyad gerekli." }).max(120),
  phone: z.string().trim().min(5, { error: "Telefon gerekli." }).max(40),
  taxNumber: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, { error: "VKN 10 (veya TCKN 11) haneli olmalı." })
    .optional()
    .or(z.literal("")),
  taxOffice: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Mevcut şifre gerekli." }),
    newPassword: z.string().min(8, { error: "Yeni şifre en az 8 karakter olmalı." }).max(100),
    confirmPassword: z.string().min(1, { error: "Şifre tekrarı gerekli." }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    error: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
