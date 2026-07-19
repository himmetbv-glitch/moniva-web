/**
 * Kategori hazırlığı (idempotent):
 *  1) FAMILY_MAP'te geçen tüm MEVCUT kategori kodlarının var olduğunu doğrular.
 *  2) Tek "Kategorisiz (Düzenlenecek)" kovasını (yoksa) oluşturur.
 * Yeni taksonomi kategorisi OLUŞTURMAZ. Kod -> id haritası döner.
 * Tek başına çalıştır: npx tsx prisma/import/ensure-categories.ts
 */
import { prisma } from "../../src/lib/prisma";
import { FAMILY_MAP, NEW_CATEGORIES, UNCAT_CODE } from "./moniva-import.config";
import { makeUnique, slugify } from "./util";

export async function ensureCategories(): Promise<Map<string, string>> {
  const referenced = new Set(Object.values(FAMILY_MAP).map((f) => f.categoryCode));

  const existing = await prisma.category.findMany({
    select: { id: true, code: true, slug: true },
  });
  const byCode = new Map(existing.map((c) => [c.code, c.id]));
  const usedSlugs = new Set(existing.map((c) => c.slug));
  const uniq = makeUnique(usedSlugs);

  // 1) Mevcut olması gereken kategoriler gerçekten var mı?
  const missing = [...referenced].filter((c) => c !== UNCAT_CODE && !byCode.has(c));
  if (missing.length) {
    throw new Error("Eksik MEVCUT kategori kodları: " + missing.join(", "));
  }

  // 2) Kova kategorisini (yoksa) oluştur.
  for (const nc of NEW_CATEGORIES) {
    if (byCode.has(nc.code)) continue;
    const parentId = nc.parentCode ? byCode.get(nc.parentCode) ?? null : null;
    const created = await prisma.category.create({
      data: {
        code: nc.code,
        slug: uniq(slugify(nc.name)),
        order: nc.order,
        isActive: true,
        showInMenu: nc.showInMenu,
        parentId,
        translations: { create: [{ locale: "TR", name: nc.name }] },
      },
      select: { id: true },
    });
    byCode.set(nc.code, created.id);
    console.log(`+ kategori oluşturuldu: [${nc.code}] ${nc.name}`);
  }

  return byCode;
}

async function main() {
  const map = await ensureCategories();
  console.log(`Kategoriler hazır (${map.size} kod). Kova [${UNCAT_CODE}] id: ${map.get(UNCAT_CODE)}`);
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith("ensure-categories.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
