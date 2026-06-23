import { z } from "zod";

// Pozisyon listesi artık Ayarlar'dan yönetiliyor (SiteSetting.careerPositions);
// burada yalnızca metin olarak doğrulanır, geçerlilik route'ta listeye göre kontrol edilir.

export const EXPERIENCES = [
  "Öğrenci / Yeni mezun",
  "0–2 yıl",
  "3–5 yıl",
  "6–10 yıl",
  "10+ yıl",
] as const;

export const CV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const CV_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const jobApplicationSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Ad soyad gerekli." }).max(120),
  email: z.string().trim().toLowerCase().email({ error: "Geçerli bir e-posta girin." }).max(160),
  phone: z.string().trim().min(5, { error: "Telefon gerekli." }).max(40),
  location: z.string().trim().max(120).optional().default(""),
  position: z.string().trim().min(2, { error: "Bir departman seçin." }).max(80),
  experience: z.string().trim().max(80).optional().default(""),
  linkedinUrl: z.string().trim().max(300).optional().default(""),
  coverNote: z
    .string()
    .trim()
    .min(10, { error: "Lütfen kısa bir not yazın." })
    .max(4000),
  kvkkConsent: z.literal(true, { error: "KVKK onayı gerekli." }),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
