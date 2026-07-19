/**
 * 472 yeni (yerelde olmayan) ürünü UNCAT kovaya create eder.
 * Description'daki keyword'lere göre otomatik kategori tahmini yapar (varsa daha spesifik kategoriye).
 * Kalanları UNCAT'e atar (kullanıcı sonra admin panelinden taşır).
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const NOT_MATCHED = "/tmp/moniva_scrape/not-matched.json";
const CATEGORIES  = "/tmp/moniva_scrape/product_categories.json";
const IMAGE_PUBLIC_PREFIX = "/products/scraped";

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

// Keyword → yerel kategori code (description/use_place taraması için)
// (En spesifikten en jenerike sıralanmış — ilk eşleşen kazanır)
const KEYWORD_MAP: [RegExp, string][] = [
  [/K\.H\..*(TABLA|PANEL)/i,     "KHPD"],
  [/KURU HAVA.*PANEL/i,          "KHPD"],
  [/PANEL.*ETEK|ETEK.*SAC/i,     "KHPE"],
  [/S[- ]?KAM/i,                 "SCAM"],
  [/FREN YAYI/i,                 "FY"],
  [/BURÇ|BUSHES/i,               "BURC"],
  [/BAĞLANTI/i,                  "BAGL"],
  [/PABUÇ BALATA/i,              "FPBL"],
  [/PABUÇ KİLİD/i,               "FPKL"],
  [/PABUÇ TAMİR/i,               "FPTK"],
  [/PABUÇ.*MAKARA.*KİLİD/i,      "FPMK"],
  [/PABUÇ.*MAKARA.*PİM/i,        "FPMP"],
  [/PABUÇ MAKARA/i,              "FPMR"],
  [/HAVA TÜP|AIR TUBE/i,         "HT"],
  [/FREN TABLA/i,                "FT"],
  [/DEFRANSİYEL/i,               "DEFR"],
  [/DİNGİL/i,                    "DING"],
  [/DORSE/i,                     "DORS2"],
];

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

function guessCategoryCode(p: Scraped): string {
  const text = [p.description, p.use_place, p.title].filter(Boolean).join(" ");
  for (const [rx, code] of KEYWORD_MAP) if (rx.test(text)) return code;
  return "UNCAT";
}

function extractSkuPrefix(stockCode: string): string {
  // "03.4900.100.011" → "0349" (ilk 4 rakam alan referansı)
  // Ama daha basit: rakamları al, ilk 3 karakter
  const digits = stockCode.replace(/\D/g,"");
  return digits.slice(0, 3) || "NEW";
}

async function main() {
  const nm: Scraped[] = JSON.parse(fs.readFileSync(NOT_MATCHED, "utf-8"));
  console.log(`${nm.length} yeni ürün işlenecek`);

  // Kategori code → id lookup
  const cats = await prisma.category.findMany({ select: { id: true, code: true } });
  const codeToId = new Map(cats.map(c => [c.code, c.id]));

  // Moniva brand id (default fallback)
  const monivaBrand = await prisma.brand.findFirst({ where: { slug: "moniva" }, select: { id: true } });
  if (!monivaBrand) throw new Error("Moniva markası bulunamadı");

  // Brand cache
  const brandCache = new Map<string, string>();
  brandCache.set("Moniva", monivaBrand.id);
  const brandsFromScrape = await prisma.brand.findMany({ select: { id: true, name: true } });
  brandsFromScrape.forEach(b => brandCache.set(b.name, b.id));

  const stats: Record<string, number> = { created: 0, skip_no_stock: 0, uncat: 0 };
  const catAssigned: Record<string, number> = {};

  // SKU sequence tracker (aynı prefix için ardışık sayı)
  const seqCache = new Map<string, number>();

  for (let i = 0; i < nm.length; i++) {
    const p = nm[i];
    if (!p.stock_code) { stats.skip_no_stock++; continue; }

    // Zaten eklenmiş mi kontrol (idempotent)
    const alreadyByOem = await prisma.oemReference.findFirst({
      where: { oemNumber: p.stock_code },
      select: { productId: true },
    });
    if (alreadyByOem) continue;

    // Kategori tahmin et
    const catCode = guessCategoryCode(p);
    let catId = codeToId.get(catCode) ?? codeToId.get("UNCAT");
    if (!catId) throw new Error(`UNCAT bulunamadı`);
    if (catCode === "UNCAT") stats.uncat++;
    catAssigned[catCode] = (catAssigned[catCode] ?? 0) + 1;

    // Brand
    const brandId = p.brand ? (brandCache.get(p.brand) ?? monivaBrand.id) : monivaBrand.id;

    // SKU üret: MNV-{prefix3}-{seq4}
    const prefix = extractSkuPrefix(p.stock_code);
    let seq = seqCache.get(prefix) ?? 0;
    // İlk kullanımda DB'den en yüksek seq'i bul
    if (seq === 0) {
      const like = `MNV-${prefix}-%`;
      const existing = await prisma.product.findMany({
        where: { sku: { startsWith: `MNV-${prefix}-` } },
        select: { sku: true },
      });
      const numbers = existing.map(e => {
        const m = e.sku.match(/MNV-[A-Z0-9]+-(\d+)$/);
        return m ? parseInt(m[1]) : 0;
      });
      seq = Math.max(0, ...numbers);
    }
    seq++;
    seqCache.set(prefix, seq);
    const sku = `MNV-${prefix}-${String(seq).padStart(4, "0")}`;

    // Product name = description veya use_place veya stock_code
    const nameTr = p.description || p.use_place || p.stock_code;
    const slug = slugify(`${p.stock_code}-${nameTr}`).slice(0, 80);

    // Specs: her key-value + USE PLACE + OE NUMBER
    const specsToCreate: any[] = [];
    let order = 0;
    if (p.use_place) specsToCreate.push({ key: "Kullanıldığı Yer", value: p.use_place, order: -1 });
    specsToCreate.push({ key: "Stok Kodu", value: p.stock_code, order: 0 });
    for (const [k, v] of Object.entries(p.specs)) {
      specsToCreate.push({ key: k, value: v, order: ++order });
    }

    // OEM: stock code (ana) + OE NUMBER (varsa)
    const oemsToCreate: any[] = [
      { oemNumber: p.stock_code, manufacturer: p.brand ?? null },
    ];
    if (p.oe_number) oemsToCreate.push({ oemNumber: p.oe_number, manufacturer: p.brand ?? null });

    // Image
    const imagesToCreate: any[] = [];
    if (p.image_url) {
      const ext = p.image_url.split(".").pop()?.toLowerCase() || "jpg";
      const localPath = `${IMAGE_PUBLIC_PREFIX}/${p.moniva_id}.${ext}`;
      imagesToCreate.push({ url: localPath, isMain: true, order: 0, alt: p.title ?? null });
    }

    try {
      await prisma.product.create({
        data: {
          sku,
          slug,
          isActive: true,
          categoryId: catId,
          brandId,
          translations: { create: [{ locale: "TR", name: nameTr, description: nameTr }] },
          specs:         { create: specsToCreate },
          oemReferences: { create: oemsToCreate },
          images:        imagesToCreate.length ? { create: imagesToCreate } : undefined,
        },
      });
      stats.created++;
      if (i % 50 === 0) console.log(`   ${i+1}/${nm.length} işlendi (created: ${stats.created})`);
    } catch (e: any) {
      console.error(`  HATA ${sku} / ${p.stock_code}: ${e.message}`);
    }
  }

  console.log(`\nSonuç:`);
  for (const [k, v] of Object.entries(stats)) console.log(`  ${k.padEnd(15)} ${v}`);
  console.log(`\nKategori dağılımı:`);
  for (const [c, n] of Object.entries(catAssigned).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${c.padEnd(6)} ${n}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
