import "server-only";

import { Locale } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export type ImportLookups = {
  // küçük-harf kategori adı/slug → id
  categoryByKey: Record<string, string>;
  // küçük-harf marka adı → id
  brandByName: Record<string, string>;
  categoryLabels: string[];
};

export async function getImportLookups(
  locale: Locale = DEFAULT_LOCALE,
): Promise<ImportLookups> {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        translations: { select: { locale: true, name: true } },
      },
    }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);

  const categoryByKey: Record<string, string> = {};
  const labels: string[] = [];
  for (const c of categories) {
    categoryByKey[c.slug.toLowerCase()] = c.id;
    const name =
      c.translations.find((t) => t.locale === locale)?.name ??
      c.translations[0]?.name;
    if (name) {
      categoryByKey[name.toLowerCase()] = c.id;
      labels.push(name);
    }
  }

  const brandByName: Record<string, string> = {};
  for (const b of brands) brandByName[b.name.toLowerCase()] = b.id;

  return { categoryByKey, brandByName, categoryLabels: labels };
}
