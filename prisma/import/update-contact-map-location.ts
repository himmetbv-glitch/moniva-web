/**
 * İletişim sayfası "Konum" bölümündeki harita koordinatlarını Moniva'nın gerçek
 * konumuna (Google Maps kaydı) günceller.
 *
 * Yaklaşım cerrahi: yalnız harita URL'leri ve koordinat metinlerindeki SAYILAR
 * değişir. `_i18n` çevirileri (ar/en/ru) korunur — derece harfleri dile göre
 * farklı olduğundan (° K/D, ° N/E, ° С/В, ° شمالاً/شرقاً) sadece sayı kısmı
 * değiştirilir, sonek olduğu gibi bırakılır.
 *
 * Kullanım:
 *   # önizleme
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env prisma/import/update-contact-map-location.ts --dry-run
 *   # uygula
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env prisma/import/update-contact-map-location.ts
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");

const OLD_LAT = "37.952";
const OLD_LNG = "32.500";
const NEW_LAT = "37.9868";
const NEW_LNG = "32.5990";

const NEW = {
  directionsHref: "https://www.google.com/maps/dir/?api=1&destination=37.986767,32.598997",
  mapHref: "https://www.openstreetmap.org/?mlat=37.986767&mlon=32.598997#map=16/37.986767/32.598997",
  mapSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=32.584%2C37.9788%2C32.614%2C37.9948&layer=mapnik&marker=37.986767%2C32.598997",
  coordLat: `${NEW_LAT}° K`,
  coordLng: `${NEW_LNG}° D`,
};

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});

// "37.952° N" → "37.9868° N" (sonek/dil korunur)
function swapCoord(v: unknown, oldNum: string, newNum: string): unknown {
  if (typeof v !== "string" || !v.includes(oldNum)) return v;
  return v.replace(oldNum, newNum);
}

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Hedef DB: ${url.includes("localhost") ? "YEREL" : "UZAK (Neon)"}${DRY ? "  [DRY-RUN]" : ""}\n`);

  const page = await prisma.managedPage.findFirst({
    where: { key: "contact" },
    select: { sections: { where: { key: "loc" }, select: { id: true, data: true } } },
  });
  const section = page?.sections[0];
  if (!section) {
    console.error("İletişim sayfasının 'loc' bölümü bulunamadı.");
    process.exit(1);
  }

  const data = section.data as Record<string, unknown>;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `/tmp/contact-loc-backup-${stamp}.json`;
  writeFileSync(backup, JSON.stringify(data, null, 1));
  console.log(`Yedek: ${backup}\n`);

  const next: Record<string, unknown> = { ...data, ...NEW };

  // Çeviriler: yalnız koordinat sayılarını değiştir, dile özgü soneki koru.
  const i18n = data._i18n as Record<string, Record<string, unknown>> | undefined;
  if (i18n) {
    const nextI18n: Record<string, Record<string, unknown>> = {};
    for (const [loc, tr] of Object.entries(i18n)) {
      nextI18n[loc] = {
        ...tr,
        coordLat: swapCoord(tr.coordLat, OLD_LAT, NEW_LAT),
        coordLng: swapCoord(tr.coordLng, OLD_LNG, NEW_LNG),
      };
      console.log(`  [${loc}] ${String(tr.coordLat)} → ${String(nextI18n[loc].coordLat)}`);
      console.log(`  [${loc}] ${String(tr.coordLng)} → ${String(nextI18n[loc].coordLng)}`);
    }
    next._i18n = nextI18n;
  }

  console.log(`\n  [tr] ${String(data.coordLat)} → ${NEW.coordLat}`);
  console.log(`  [tr] ${String(data.coordLng)} → ${NEW.coordLng}`);
  console.log(`  mapSrc / mapHref / directionsHref → 37.986767, 32.598997`);

  if (!DRY) {
    await prisma.pageSection.update({ where: { id: section.id }, data: { data: next } });
    console.log("\n✓ Güncellendi.");
  } else {
    console.log("\n(dry-run — yazma yapılmadı)");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
