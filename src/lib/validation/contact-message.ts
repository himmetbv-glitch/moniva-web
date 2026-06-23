import { z } from "zod";

export const TOPICS = [
  "Satış talebi",
  "Teknik destek",
  "Distribütör olmak",
  "Basın / Medya",
  "Kariyer",
  "Diğer",
] as const;

export const COUNTRIES = [
  "Türkiye",
  "Almanya",
  "Rusya",
  "Birleşik Krallık",
  "Hollanda",
  "Polonya",
  "Diğer",
] as const;

export const contactMessageSchema = z.object({
  firstName: z.string().trim().min(1, { error: "Ad gerekli." }).max(80),
  lastName: z.string().trim().min(1, { error: "Soyad gerekli." }).max(80),
  company: z.string().trim().max(120).optional().default(""),
  country: z.enum(COUNTRIES, { error: "Ülke seçin." }),
  email: z.string().trim().toLowerCase().email({ error: "Geçerli bir e-posta girin." }).max(160),
  phone: z.string().trim().max(40).optional().default(""),
  topic: z.enum(TOPICS, { error: "Konu seçin." }),
  oemRefs: z.string().trim().max(400).optional().default(""),
  message: z.string().trim().min(10, { error: "Lütfen mesajınızı yazın." }).max(4000),
  kvkkConsent: z.literal(true, { error: "Gizlilik onayı gerekli." }),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
