/**
 * İletişim → Konum bölümüne Rusya temsilciliğini ek konum olarak ekler.
 * Koordinat: Google Maps kaydından (56.0273572, 37.4218743).
 *
 * Idempotent: aynı cardTitle'a sahip kayıt varsa yeniden eklemez, günceller.
 * `_i18n` çevirileri ve genel merkez verisi korunur.
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env prisma/import/add-russia-location.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");

const LAT = "56.0273572";
const LNG = "37.4218743";

const RUSSIA = {
  eyebrow: "Rusya",
  title: "Rusya'daki Yerel İletişim Noktamız",
  body: "",
  directionsHref: `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`,
  mapHref: `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LNG}#map=16/${LAT}/${LNG}`,
  mapSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=37.4069%2C56.0194%2C37.4369%2C56.0354" +
    `&layer=mapnik&marker=${LAT}%2C${LNG}`,
  cardTitle: "MONIVA RU",
  cardLocation: "Moskova Bölgesi, Rusya",
  cardAddressLines: [] as string[], // adres kullanıcıdan gelecek — panelden de girilebilir
  coordLat: "56.0274° K",
  coordLng: "37.4219° D",
};

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Hedef DB: ${url.includes("localhost") ? "YEREL" : "UZAK (Neon)"}${DRY ? "  [DRY-RUN]" : ""}\n`);

  const page = await prisma.managedPage.findFirst({
    where: { key: "contact" },
    select: { sections: { where: { key: "loc" }, select: { id: true, data: true } } },
  });
  const section = page?.sections[0];
  if (!section) {
    console.error("İletişim 'loc' bölümü bulunamadı.");
    process.exit(1);
  }

  const data = section.data as Record<string, unknown>;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `/tmp/contact-loc-backup-${stamp}.json`;
  writeFileSync(backup, JSON.stringify(data, null, 1));
  console.log(`Yedek: ${backup}`);

  const extra = Array.isArray(data.extra) ? [...(data.extra as Record<string, unknown>[])] : [];
  const idx = extra.findIndex((e) => e?.cardTitle === RUSSIA.cardTitle);

  if (idx >= 0) {
    // Mevcut kaydı güncelle ama elle girilmiş adres satırlarını EZME.
    const cur = extra[idx];
    const curLines = Array.isArray(cur.cardAddressLines) ? (cur.cardAddressLines as string[]) : [];
    extra[idx] = { ...cur, ...RUSSIA, cardAddressLines: curLines.length ? curLines : RUSSIA.cardAddressLines };
    console.log(`\n"${RUSSIA.cardTitle}" zaten vardı → güncellendi (adres satırları korundu).`);
  } else {
    extra.push(RUSSIA);
    console.log(`\n"${RUSSIA.cardTitle}" ek konum olarak EKLENDİ.`);
  }

  console.log(`  başlık : ${RUSSIA.title}`);
  console.log(`  konum  : ${RUSSIA.cardLocation}`);
  console.log(`  koordinat: ${LAT}, ${LNG}`);
  console.log(`  adres  : ${extra[idx >= 0 ? idx : extra.length - 1].cardAddressLines || "(boş — panelden girilecek)"}`);
  console.log(`  toplam ek konum: ${extra.length}`);

  if (!DRY) {
    await prisma.pageSection.update({
      where: { id: section.id },
      data: { data: { ...data, extra } },
    });
    console.log("\n✓ Kaydedildi.");
  } else {
    console.log("\n(dry-run — yazma yapılmadı)");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
