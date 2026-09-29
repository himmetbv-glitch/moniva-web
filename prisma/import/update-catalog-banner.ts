/**
 * Ürünler sayfası banner açıklamasını 4 dilde günceller ("24 saat içinde"
 * sözü kaldırıldı — firma talebi 2026-09-29).
 *
 * Yalnız `subtitle` alanlarına dokunur; diğer banner alanları ve _i18n'deki
 * başka anahtarlar korunur. Eski veriyi /tmp'ye yedekler.
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env \
 *     prisma/import/update-catalog-banner.ts --dry-run
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL });

const SUBTITLE = {
  tr: "Kamyon, treyler ve ticari araçlar için OEM ve aftermarket yedek parçalar. Fiyat gösterilmez - ürünleri teklif listenize ekleyin. En kısa sürede dönüş sağlanır.",
  en: "OEM and aftermarket spare parts for trucks, trailers and commercial vehicles. Prices are not shown - add products to your quote list. We will get back to you as soon as possible.",
  ru: "OEM и aftermarket запасные части для грузовиков, прицепов и коммерческих автомобилей. Цены не отображаются - добавьте товары в список запросов. Мы ответим в кратчайшие сроки.",
  ar: "قطع غيار OEM وبديلة للشاحنات والمقطورات والمركبات التجاريّة. الأسعار غير معروضة - أضف المنتجات إلى قائمة طلبات الأسعار. سنعود إليك في أقرب وقت ممكن.",
} as const;

type Data = Record<string, unknown> & { _i18n?: Record<string, Record<string, unknown>> };

async function main() {
  const section = await prisma.pageSection.findFirst({
    where: { key: "banner", page: { key: "catalog" } },
    select: { id: true, data: true },
  });
  if (!section) throw new Error("catalog/banner section not found");

  const before = section.data as Data;
  const i18n = { ...(before._i18n ?? {}) };
  for (const loc of ["en", "ru", "ar"] as const) i18n[loc] = { ...(i18n[loc] ?? {}), subtitle: SUBTITLE[loc] };
  const after: Data = { ...before, subtitle: SUBTITLE.tr, _i18n: i18n };

  const changed = JSON.stringify(before) !== JSON.stringify(after);
  console.log({
    changed,
    tr: { from: before.subtitle, to: after.subtitle },
    en: { from: before._i18n?.en?.subtitle, to: SUBTITLE.en },
  });
  if (DRY || !changed) return;

  const backup = `/tmp/catalog-banner-backup-${Date.now()}.json`;
  writeFileSync(backup, JSON.stringify({ id: section.id, data: before }, null, 1));
  await prisma.pageSection.update({ where: { id: section.id }, data: { data: after as Prisma.InputJsonValue } });
  console.log("updated; backup:", backup);
}

main().finally(() => prisma.$disconnect());
