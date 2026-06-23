import { prisma } from "../src/lib/prisma";

// Katalog türleri (yönetilebilir) — slug kararlı anahtar, name/color düzenlenebilir.
const TYPES: { slug: string; name: string; color: string; order: number }[] = [
  { slug: "full", name: "Genel Katalog", color: "#1B1640", order: 0 },
  { slug: "reference", name: "Çapraz Referans", color: "#2A6FA3", order: 1 },
  { slug: "family", name: "Ürün Ailesi", color: "#4F3D8C", order: 2 },
  { slug: "brand", name: "Marka Kılavuzu", color: "#C97A1A", order: 3 },
];

// Mockup'taki kataloglar (typeSlug ile türe bağlanır). Hepsi DRAFT, dosyasız.
type Seed = {
  title: string;
  typeSlug: string;
  languages: string[];
  version: string;
  pageCount: number;
  featured?: boolean;
  description: string;
};

const CATALOGUES: Seed[] = [
  { title: "Master Catalogue 2026", typeSlug: "full", languages: ["EN"], version: "v2026.1", pageCount: 480, featured: true, description: "The complete MONIVA range — every SKU across all six system families, with technical specs, OEM cross-references and fitment data." },
  { title: "OEM Cross-Reference Guide", typeSlug: "reference", languages: ["EN", "TR"], version: "v2026.1", pageCount: 210, featured: true, description: "Look up any OEM number and find the matching MONIVA equivalent. Covers Knorr-Bremse, WABCO, BPW, SAF-Holland and more." },
  { title: "Brake Systems", typeSlug: "family", languages: ["EN"], version: "v3.2", pageCount: 128, description: "Spring brake chambers, S-camshafts, shoes, linings and air brake panel components for trucks and trailers." },
  { title: "Air Suspension", typeSlug: "family", languages: ["EN"], version: "v3.1", pageCount: 96, description: "Levelling valves, air bellows, shock absorbers and suspension repair kits across major axle platforms." },
  { title: "Axle & Wheel Ends", typeSlug: "family", languages: ["EN"], version: "v2.8", pageCount: 84, description: "Hubs, drums, bearings, ABS sensors and wheel-end hardware for commercial axles." },
  { title: "Drivetrain Parts", typeSlug: "family", languages: ["EN"], version: "v2.5", pageCount: 72, description: "Propshafts, universal joints, centre bearings and driveline components." },
  { title: "Electrical Systems", typeSlug: "family", languages: ["EN"], version: "v2.2", pageCount: 64, description: "Sensors, switches, lighting and wiring harness parts for the full vehicle." },
  { title: "Cabin & Body", typeSlug: "family", languages: ["EN"], version: "v1.0", pageCount: 58, description: "Mirrors, door and cabin hardware, body panels and trim components." },
  { title: "KNORR-BREMSE Range", typeSlug: "brand", languages: ["EN"], version: "2026", pageCount: 54, description: "MONIVA equivalents and cross-references for the Knorr-Bremse braking program." },
  { title: "WABCO Range", typeSlug: "brand", languages: ["EN"], version: "2026", pageCount: 48, description: "Air management, EBS and braking equivalents matched to WABCO part numbers." },
  { title: "Genel Katalog (Türkçe)", typeSlug: "full", languages: ["TR"], version: "v2026.1", pageCount: 480, description: "Tüm MONIVA ürün gamının Türkçe tam kataloğu — teknik özellikler ve OEM çapraz referanslar." },
];

function slugify(s: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return s
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => map[c] ?? c)
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  // Türler — slug'a göre upsert.
  const typeIdBySlug = new Map<string, string>();
  for (const t of TYPES) {
    const row = await prisma.catalogueType.upsert({
      where: { slug: t.slug },
      update: { name: t.name, color: t.color, order: t.order },
      create: t,
      select: { id: true, slug: true },
    });
    typeIdBySlug.set(row.slug, row.id);
  }
  console.log(`Türler hazır: ${TYPES.length}`);

  let created = 0;
  let skipped = 0;
  for (let i = 0; i < CATALOGUES.length; i++) {
    const c = CATALOGUES[i];
    const slug = slugify(c.title);
    const exists = await prisma.catalogue.findUnique({ where: { slug }, select: { id: true } });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.catalogue.create({
      data: {
        slug,
        title: c.title,
        typeId: typeIdBySlug.get(c.typeSlug)!,
        languages: c.languages,
        version: c.version,
        pageCount: c.pageCount,
        description: c.description,
        featured: c.featured ?? false,
        status: "DRAFT",
        order: i,
      },
    });
    created++;
  }
  const total = await prisma.catalogue.count();
  console.log(`OK — ${created} katalog eklendi, ${skipped} atlandı. Toplam: ${total}. Hepsi DRAFT.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
