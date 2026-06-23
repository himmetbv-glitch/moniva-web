import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bcrypt native bir modül — bundle'a girmesin, runtime'da gerçek require ile yüklensin.
  // (Aksi halde SSR chunk'ında "require is not defined" hatası verir.)
  serverExternalPackages: ["bcrypt"],

  // Teklif PDF route'u runtime'da gömülü TTF fontu okur — bundle'a dahil et.
  outputFileTracingIncludes: {
    "/admin/inquiries/[id]/pdf": ["./src/lib/admin/pdf-fonts/**"],
  },
};

export default nextConfig;
