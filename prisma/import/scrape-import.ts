/**
 * moniva.com.tr'den scrape edilen products.json'ı yerel DB'ye uygular.
 *
 * MVP kapsamı:
 * - MEVCUT ürünleri güncelle (stock code ile eşleşen ~1350)
 *   • brand → Brand tablosundan (yenileri yarat)
 *   • USE PLACE  → ProductSpec (key='Kullanıldığı Yer')
 *   • OE NUMBER  → OemReference (varsa)
 *   • YENİ spec kolonları → ProductSpec (mevcut yoksa)
 *   • image_url  → ProductImage (mevcut hiç yoksa)
 * - YENİ ürünleri (~170) SADECE LOG'a yaz, DB'ye eklemez
 *
 * Idempotent: tekrar çalıştırılabilir.
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const JSON_PATH = "/tmp/moniva_scrape/products.json";
const IMAGE_PUBLIC_PREFIX = "/products/scraped"; // Next.js public/ altına relatif

const prisma = new PrismaClient();

type Scraped = {
  moniva_id: number;
  stock_code: string | null;
  brand: string | null;
  title: string | null;
  description: string | null;
  use_place: string | null;
  oe_number: string | null;
  image_url: string | null;
  specs: Record<string, string>;
  source_url: string;
};

// Turkish label mapping — moniva.com.tr İngilizce spec key → yerel Türkçe key (mevcut config ile uyumlu)
const SPEC_KEY_MAP: Record<string, { label: string; unit: string | null }> = {
  "TYPE":                        { label: "Tip", unit: null },
  "STROKE":                      { label: "Strok", unit: "mm" },
  "DRUM":                        { label: "Kampana", unit: "mm" },
  "HIVE":                        { label: "Petek", unit: "mm" },
  "DRUM DIAMETER":               { label: "Kampana Çapı", unit: "mm" },
  "LINING NUMBER":               { label: "Balata No", unit: null },
  "DIMENSIONS":                  { label: "Ölçü", unit: "mm" },
  "DIRECTION":                   { label: "Yön", unit: null },
  "OUTER DIAMETER":              { label: "Dış Çap", unit: "mm" },
  "FULL SIZE":                   { label: "Tam Ölçü", unit: "mm" },
  "SIZE":                        { label: "Ölçü", unit: "mm" },
  "WIDTH":                       { label: "Genişlik", unit: "mm" },
  "DIAMETER":                    { label: "Çap", unit: "mm" },
  "PIN SIZE":                    { label: "Pim Ölçüsü", unit: "mm" },
  "PIN DIAMETER":                { label: "Pim Çapı", unit: "mm" },
  "INNER DIAMETER":              { label: "İç Çap", unit: "mm" },
  "LINING WIDTH":                { label: "Balata Genişliği", unit: "mm" },
  "ROLLER":                      { label: "Makara Adedi", unit: "adet" },
  "PIN":                         { label: "Pim Adedi", unit: "adet" },
  "LITER":                       { label: "Hacim", unit: "L" },
  "TUBE TYPE":                   { label: "Tüp Tipi", unit: "mm" },
  // Scrape sırasında keşfedilen yeni kolonlar
  "NUMBER OF HOLES":             { label: "Delik Sayısı", unit: "adet" },
  "SCREW HOLE NUMBER":           { label: "Vida Delik Sayısı", unit: "adet" },
  "HOLE DIAMETER":               { label: "Delik Çapı", unit: "mm" },
  "HOLE CENTER":                 { label: "Delik Merkezi", unit: "mm" },
  "DISTANCE BETWEEN TWO HOLES":  { label: "İki Delik Arası", unit: "mm" },
  "PIN, S SEAM DIAMETER":        { label: "Pim / S-Kam Çapı", unit: "mm" },
  "FLANGE LENGTH":               { label: "Flanş Boyu", unit: "mm" },
  "FLANGE WITDH":                { label: "Flanş Genişliği", unit: "mm" },
  "TYPE OF PULLER":              { label: "Çekici Tipi", unit: null },
  "SHAFT LENGTH":                { label: "Mil Boyu", unit: null },
  "CENTER":                      { label: "Merkez", unit: "mm" },
  "SCREW":                       { label: "Vida", unit: null },
  "SCREW LENGTH":                { label: "Vida Uzunluğu", unit: "mm" },
  "TOP BOWL":                    { label: "Üst Kase", unit: "mm" },
  "AIR INTAKE":                  { label: "Hava Girişi", unit: null },
  "KG":                          { label: "Ağırlık", unit: "kg" },
  "OPERATING PRESSURE":          { label: "Çalışma Basıncı", unit: "bar" },
  "GRAVEIL BUSH SIZE":           { label: "Burç Ölçüsü", unit: "mm" },
};

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

async function ensureBrand(name: string): Promise<string> {
  const slug = slugify(name);
  const b = await prisma.brand.upsert({
    where: { slug },
    update: {},
    create: { name, slug, isActive: true },
  });
  return b.id;
}

async function findByStockCode(stockCode: string) {
  // 1. OemReference'ta ara (import config'e göre orijinal kod OEM'e yazılıyor)
  const oem = await prisma.oemReference.findFirst({
    where: { oemNumber: stockCode },
    include: { product: true },
  });
  if (oem) return oem.product;
  // 2. ProductSpec 'Stok Kodu' key ile ara
  const spec = await prisma.productSpec.findFirst({
    where: { key: "Stok Kodu", value: stockCode },
    include: { product: true },
  });
  if (spec) return spec.product;
  return null;
}

async function main() {
  const rawJson = fs.readFileSync(JSON_PATH, "utf-8");
  const parsed: Record<string, Scraped> = JSON.parse(rawJson);
  const products = Object.values(parsed);
  console.log(`\nScrape json: ${products.length} ürün yüklendi`);

  // 1) Brand tablosunu hazırla
  const brandCache = new Map<string, string>();
  const distinctBrands = new Set<string>();
  for (const p of products) if (p.brand) distinctBrands.add(p.brand);
  console.log(`\n1) ${distinctBrands.size} farklı marka upsert ediliyor…`);
  for (const b of distinctBrands) {
    const id = await ensureBrand(b);
    brandCache.set(b, id);
    console.log(`   ✓ ${b}`);
  }

  // 2) Ürünleri işle
  const stats = {
    matched: 0, notMatched: 0, updatedBrand: 0, addedUsePlace: 0,
    addedOeRef: 0, addedSpecs: 0, addedImage: 0,
  };
  const notMatched: Scraped[] = [];

  console.log(`\n2) Ürünleri işliyor…`);
  let i = 0;
  for (const p of products) {
    i++;
    if (i % 100 === 0) console.log(`   … ${i}/${products.length} işlendi`);
    if (!p.stock_code) continue;

    const product = await findByStockCode(p.stock_code);
    if (!product) {
      notMatched.push(p);
      stats.notMatched++;
      continue;
    }
    stats.matched++;

    // --- Brand ata ---
    if (p.brand) {
      const brandId = brandCache.get(p.brand)!;
      if (product.brandId !== brandId) {
        await prisma.product.update({ where: { id: product.id }, data: { brandId } });
        stats.updatedBrand++;
      }
    }

    // --- USE PLACE → ProductSpec (key='Kullanıldığı Yer') ---
    if (p.use_place) {
      const exists = await prisma.productSpec.findFirst({
        where: { productId: product.id, key: "Kullanıldığı Yer" },
      });
      if (!exists) {
        await prisma.productSpec.create({
          data: { productId: product.id, key: "Kullanıldığı Yer", value: p.use_place, order: -1 },
        });
        stats.addedUsePlace++;
      }
    }

    // --- OE NUMBER → OemReference ---
    if (p.oe_number) {
      const exists = await prisma.oemReference.findFirst({
        where: { productId: product.id, oemNumber: p.oe_number },
      });
      if (!exists) {
        await prisma.oemReference.create({
          data: {
            productId: product.id,
            oemNumber: p.oe_number,
            manufacturer: p.brand ?? null,
          },
        });
        stats.addedOeRef++;
      }
    }

    // --- Yeni spec kolonları ---
    for (const [rawKey, val] of Object.entries(p.specs)) {
      const mapped = SPEC_KEY_MAP[rawKey];
      const label = mapped?.label ?? rawKey;
      const unit  = mapped?.unit ?? null;
      const exists = await prisma.productSpec.findFirst({
        where: { productId: product.id, key: label },
      });
      if (!exists) {
        await prisma.productSpec.create({
          data: { productId: product.id, key: label, value: val, unit, order: 10 },
        });
        stats.addedSpecs++;
      }
    }

    // --- Görsel ---
    if (p.image_url) {
      const hasAny = await prisma.productImage.findFirst({ where: { productId: product.id } });
      if (!hasAny) {
        const ext = p.image_url.split(".").pop()?.toLowerCase() || "jpg";
        const localPath = `${IMAGE_PUBLIC_PREFIX}/${p.moniva_id}.${ext}`;
        await prisma.productImage.create({
          data: { productId: product.id, url: localPath, isMain: true, order: 0, alt: p.title ?? null },
        });
        stats.addedImage++;
      }
    }
  }

  console.log(`\n3) Sonuç:`);
  for (const [k, v] of Object.entries(stats)) console.log(`   ${k.padEnd(14)} ${v}`);

  // Yeni ürünleri log'a yaz
  const logPath = "/tmp/moniva_scrape/not-matched.json";
  fs.writeFileSync(logPath, JSON.stringify(notMatched, null, 2), "utf-8");
  console.log(`\nYENİ (yerelde olmayan) ürün: ${notMatched.length} → ${logPath}`);
  if (notMatched.length) {
    console.log(`\nİlk 15 örnek:`);
    for (const p of notMatched.slice(0, 15)) {
      console.log(`   • id=${p.moniva_id}  stock=${p.stock_code}  brand=${p.brand ?? "-"}  use=${p.use_place ?? "-"}`);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
