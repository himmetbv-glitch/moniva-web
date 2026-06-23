import { z } from "zod";

// Form alanları "Quote System Mockup.html" Ekran 3'e birebir hizalı.
// Zorunluluklar tasarımdaki yıldız (*) işaretlerine göre.

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const quoteRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalı")
    .max(120),

  companyName: z
    .string()
    .trim()
    .min(2, "Şirket adı zorunludur")
    .max(160),

  email: z.email("Geçerli bir e-posta girin").toLowerCase(),

  phoneCountryCode: z
    .string()
    .trim()
    .regex(/^\+\d{1,4}$/, "Geçersiz ülke kodu")
    .default("+90"),

  phone: z
    .string()
    .trim()
    .min(7, "Telefon numarası eksik")
    .max(20)
    .regex(/^[\d\s]+$/, "Telefon yalnızca rakam içermeli"),

  country: z.string().trim().min(2, "Ülke seçimi zorunludur").max(80),

  city: optionalText,

  // VKN tasarımda opsiyonel; girildiyse 10 hane olmalı.
  taxNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "VKN 10 haneli olmalı")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  taxOffice: optionalText,

  // Teslimat Adresi tasarımda zorunlu.
  address: z
    .string()
    .trim()
    .min(10, "Teslimat adresi en az 10 karakter olmalı")
    .max(500),

  notes: optionalText,

  // KVKK onayı zorunlu — checkbox işaretli olmalı.
  kvkkConsent: z.coerce
    .boolean()
    .refine((v) => v === true, "KVKK aydınlatma metnini onaylamanız gerekiyor"),

  marketingConsent: z.coerce.boolean().default(false),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

/**
 * FormData'yı şemaya vermeden önce düz objeye çevirir. Checkbox işaretsizse
 * FormData'da hiç yer almaz; bu yüzden eksikleri burada normalize ediyoruz.
 */
export function quoteFormToObject(formData: FormData): Record<string, unknown> {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : undefined;
  };

  return {
    fullName: get("fullName"),
    companyName: get("companyName"),
    email: get("email"),
    phoneCountryCode: get("phoneCountryCode") ?? "+90",
    phone: get("phone"),
    country: get("country"),
    city: get("city"),
    taxNumber: get("taxNumber"),
    taxOffice: get("taxOffice"),
    address: get("address"),
    notes: get("notes"),
    kvkkConsent: formData.get("kvkkConsent") != null,
    marketingConsent: formData.get("marketingConsent") != null,
  };
}
