/**
 * MON-xxxx kaliper setlerini katalogdaki markalarının alt kategorisine taşır.
 *
 * Temmuz'daki marka ayrımı yalnız MNV kodlarından çıkarıldığı için 186 MON
 * setinin tamamı CK-OTHER'da kalmıştı. Eşleme (mon-brand-map.json), 5 marka
 * PDF'indeki "MONIVA NUMBER MON-xxxx" başlık sayfasından üretildi; her MON
 * tek bir markanın kataloğunda geçiyor.
 *
 * Güvenlik:
 *  - Yalnız categoryId değişir; sku/slug/içerik/sortOrder'a DOKUNMAZ.
 *  - Yalnız şu an CK-* altında olan ürünleri taşır (başka yere konmuşsa atlar).
 *  - Eski kategori eşlemesini /tmp'ye yedekler (geri alma için).
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env \
 *     prisma/import/move-mon-sets-to-brand.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

const map: Record<string, string> = JSON.parse(
  readFileSync(join(__dirname, "mon-brand-map.json"), "utf8"),
);

async function main() {
  const codes = [...new Set(Object.values(map))];
  const cats = await prisma.category.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });
  const catId = new Map(cats.map((c) => [c.code, c.id]));
  for (const c of codes) if (!catId.has(c)) throw new Error(`Category ${c} not found`);

  const products = await prisma.product.findMany({
    where: { sku: { in: Object.keys(map) } },
    select: { id: true, sku: true, categoryId: true, category: { select: { code: true } } },
  });

  const missing = Object.keys(map).filter((s) => !products.some((p) => p.sku === s));
  const moves: { id: string; sku: string; from: string; fromId: string; to: string }[] = [];
  const skipped: string[] = [];
  let already = 0;

  for (const p of products) {
    const to = map[p.sku];
    if (!p.category.code.startsWith("CK")) {
      skipped.push(`${p.sku} (in ${p.category.code})`);
      continue;
    }
    if (p.category.code === to) {
      already++;
      continue;
    }
    moves.push({ id: p.id, sku: p.sku, from: p.category.code, fromId: p.categoryId, to });
  }

  const summary: Record<string, number> = {};
  for (const m of moves) summary[`${m.from} → ${m.to}`] = (summary[`${m.from} → ${m.to}`] ?? 0) + 1;
  console.log({ mapped: Object.keys(map).length, found: products.length, missing, already, skipped, moves: summary });

  if (DRY || moves.length === 0) return;

  const backup = `/tmp/mon-category-backup-${Date.now()}.json`;
  writeFileSync(backup, JSON.stringify(moves.map(({ id, sku, from, fromId }) => ({ id, sku, from, fromId })), null, 1));
  console.log("backup:", backup);

  await prisma.$transaction(
    moves.map((m) => prisma.product.update({ where: { id: m.id }, data: { categoryId: catId.get(m.to)! } })),
  );
  console.log("moved:", moves.length);
}

main().finally(() => prisma.$disconnect());
