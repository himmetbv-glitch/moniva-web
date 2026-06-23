import { Role } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, { error: "Ad soyad gerekli." }).max(120),
  email: z.email({ error: "Geçerli bir e-posta girin." }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Şifre en az 8 karakter olmalı." }).max(100),
  role: z.enum(Role),
  isVerified: z.boolean().default(false),
  companyName: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(40).default(""),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;
