import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }).trim(),
  password: z.string().min(1, { error: "Şifre gerekli." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
