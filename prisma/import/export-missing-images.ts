/**
 * Görseli olmayan ürünlerin listesini Excel olarak dışa aktarır (firmaya
 * "bu ürünlerin fotoğrafını gönderin" demek için).
 *
 * Sayfalar:
 *   Özet            — kategoriye göre eksik sayısı
 *   Hava Tüpleri    — bu kategori %100 eksik, öncelikli liste
 *   Tüm Eksikler    — görseli olmayan bütün ürünler
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env prisma/import/export-missing-images.ts
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { join } from "node:path";
import { homedir } from "node:os";

const OUT = join(homedir(), "Desktop", "moniva-gorselsiz-urunler.xlsx");

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

type Row = {
  Kategori: string;
  "Stok Kodu": string;
  "Ürün Adı": string;
  Marka: string;
  "OEM Numaraları": string;
};

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Kaynak DB: ${url.includes("localhost") ? "YEREL" : "CANLI (Neon)"}\n`);

  const cats = await prisma.category.findMany({
    select: { id: true, code: true, parentId: true, translations: { select: { locale: true, name: true } } },
  });
  const catById = new Map(cats.map((c) => [c.id, c]));
  const nm = (c?: (typeof cats)[number]) =>
    c?.translations.find((t) => /^tr$/i.test(t.locale))?.name ?? c?.code ?? "";
  // "Ana > Alt" biçiminde tam yol
  const path = (id: string | null): string => {
    const c = id ? catById.get(id) : undefined;
    if (!c) return "(kategorisiz)";
    return c.parentId ? `${path(c.parentId)} > ${nm(c)}` : nm(c);
  };

  const products = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: {
      sku: true,
      categoryId: true,
      brand: { select: { name: true } },
      translations: { select: { locale: true, name: true } },
      oemReferences: { select: { oemNumber: true } },
    },
    orderBy: { sku: "asc" },
  });
  console.log(`Görseli olmayan ürün: ${products.length}`);

  const rows: Row[] = products.map((p) => ({
    Kategori: path(p.categoryId),
    "Stok Kodu": p.sku,
    "Ürün Adı": p.translations.find((t) => /^tr$/i.test(t.locale))?.name ?? "",
    Marka: p.brand?.name ?? "",
    "OEM Numaraları": p.oemReferences.map((o) => o.oemNumber).join(", "),
  }));

  // Özet
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.Kategori, (counts.get(r.Kategori) ?? 0) + 1);
  const summary = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ Kategori: k, "Görseli Olmayan Ürün": v }));

  const ht = rows.filter((r) => r.Kategori.includes("HAVA TÜPLERİ"));

  const wb = XLSX.utils.book_new();
  const add = (name: string, data: object[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    // sütun genişlikleri
    const keys = data.length ? Object.keys(data[0]) : [];
    ws["!cols"] = keys.map((k) => ({
      wch: Math.min(60, Math.max(k.length + 2, ...data.map((d) => String((d as never)[k] ?? "").length + 2))),
    }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  add("Özet", summary);
  if (ht.length) add("Hava Tüpleri", ht);
  add("Tüm Eksikler", rows);

  XLSX.writeFile(wb, OUT);

  console.log(`\n✓ Yazıldı: ${OUT}`);
  console.log(`  Özet          : ${summary.length} kategori`);
  console.log(`  Hava Tüpleri  : ${ht.length} ürün`);
  console.log(`  Tüm Eksikler  : ${rows.length} ürün`);
  console.log("\nEn çok eksik olan 8 kategori:");
  for (const s of summary.slice(0, 8)) console.log(`  ${String(s["Görseli Olmayan Ürün"]).padStart(5)}  ${s.Kategori}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
