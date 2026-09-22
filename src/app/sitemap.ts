import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

// Sitemap her zaman kanonik prod domain'i listeler (env'e bağlı değil):
// vercel.app demosu robots ile zaten tamamen kapalı, oradan sitemap sunulsa
// bile içeriği prod URL'leri gösterir — yanlış host'un dizinlenme riski yok.
const BASE = "https://moniva.com.tr";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/urunler", priority: 0.9 },
  { path: "/kataloglar", priority: 0.7 },
  { path: "/haberler", priority: 0.6 },
  { path: "/hakkinda", priority: 0.6 },
  { path: "/kalite", priority: 0.5 },
  { path: "/kariyer", priority: 0.5 },
  { path: "/iletisim", priority: 0.6 },
];

function entry(
  path: string,
  lastModified: Date,
  priority: number,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${BASE}/${locale}${path}`;
  }
  languages["x-default"] = `${BASE}/${routing.defaultLocale}${path}`;
  return {
    url: `${BASE}/${routing.defaultLocale}${path}`,
    lastModified,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, news, pages] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    }),
    prisma.newsPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  const now = new Date();

  return [
    ...STATIC_PATHS.map((s) => entry(s.path, now, s.priority)),
    ...products.map((p) => entry(`/urunler/${p.slug}`, p.updatedAt, 0.7)),
    ...news.map((n) => entry(`/haberler/${n.slug}`, n.updatedAt, 0.5)),
    ...pages.map((p) => entry(`/sayfa/${p.slug}`, p.updatedAt, 0.4)),
  ];
}
