/**
 * KURU ÇALIŞTIRMA — xlsx'i parse eder, eşleme + sayıları raporlar. DB'ye DOKUNMAZ.
 * Çalıştır: npx tsx prisma/import/dry-run.ts
 */
import { parseRows } from "./parse-xlsx";
import { UNCAT_CODE } from "./moniva-import.config";

function main() {
  const { rows, unmapped, droppedDupes, totalXlsxRows } = parseRows();

  console.log("═".repeat(64));
  console.log("MONIVA ÜRÜN IMPORT — KURU ÇALIŞTIRMA (DB'ye yazılmadı)");
  console.log("═".repeat(64));
  console.log(`xlsx satır (başlık hariç) : ${totalXlsxRows}`);
  console.log(`Eşlenemeyen (Ana::Alt)    : ${unmapped.length}`);
  console.log(`Atılan tekrar (Sınıf B)   : ${droppedDupes.length}`);
  console.log(`→ GİRİLECEK ÜRÜN          : ${rows.length}`);

  if (unmapped.length) {
    console.log("\n⚠️  EŞLENEMEYEN SATIRLAR:");
    for (const u of unmapped.slice(0, 20)) console.log(`   satır ${u.rowNo}: "${u.main}" :: "${u.sub}" (${u.code})`);
  }

  // Kategoriye göre: mevcut vs kova
  const inExisting = rows.filter((r) => r.categoryCode !== UNCAT_CODE);
  const inUncat = rows.filter((r) => r.categoryCode === UNCAT_CODE);
  console.log("\n" + "─".repeat(64));
  console.log(`MEVCUT KATEGORİLERE GİRECEK : ${inExisting.length}`);
  console.log(`KATEGORİSİZ KOVAYA GİRECEK  : ${inUncat.length}`);
  console.log("─".repeat(64));

  const byCat = new Map<string, number>();
  for (const r of inExisting) byCat.set(r.categoryCode, (byCat.get(r.categoryCode) ?? 0) + 1);
  console.log("\nMevcut kategori dağılımı (kod → ürün):");
  [...byCat.entries()].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`   ${String(n).padStart(4)}  [${c}]`));

  const byFam = new Map<string, { n: number; name: string }>();
  for (const r of inUncat) {
    const e = byFam.get(r.skuCode) ?? { n: 0, name: r.nameStem };
    e.n++; byFam.set(r.skuCode, e);
  }
  console.log("\nKategorisiz kovadaki aileler (sen sonra taşıyacaksın):");
  [...byFam.entries()].sort((a, b) => b[1].n - a[1].n).forEach(([c, e]) => console.log(`   ${String(e.n).padStart(4)}  MNV-${c}-*   ${e.name}`));

  // İçerik istatistiği
  const withSpecs = rows.filter((r) => r.specs.length > 1).length;
  const totalOem = rows.reduce((s, r) => s + r.oem.length, 0);
  const withLining = rows.filter((r) => r.oem.some((o) => o.manufacturer === "Balata")).length;
  console.log("\n" + "─".repeat(64));
  console.log("İÇERİK İSTATİSTİĞİ:");
  console.log("─".repeat(64));
  console.log(`   En az 1 teknik özelliği olan ürün : ${withSpecs}/${rows.length}`);
  console.log(`   Toplam OEM referansı              : ${totalOem}`);
  console.log(`   Balata çapraz referansı olan ürün : ${withLining}`);

  // Örnekler
  console.log("\n" + "─".repeat(64));
  console.log("ÖRNEK ÜRÜNLER:");
  console.log("─".repeat(64));
  const samples = ["UZUN", "DORS2", "FTGN", "HTUP", "SCAM", "FY"]
    .map((sc) => rows.find((r) => r.skuCode === sc))
    .filter(Boolean) as typeof rows;
  for (const s of samples) {
    const cat = s.categoryCode === UNCAT_CODE ? "KATEGORİSİZ" : s.categoryCode;
    console.log(`\n  ▸ MNV-${s.skuCode}-0001  |  kategori: ${cat}`);
    console.log(`    Ad   : ${s.name}`);
    console.log(`    Özell: ${s.specs.map((x) => `${x.key}: ${x.value}${x.unit ? " " + x.unit : ""}`).join(" · ")}`);
    console.log(`    OEM  : ${s.oem.map((o) => `${o.oemNumber}${o.manufacturer ? " (" + o.manufacturer + ")" : ""}`).join(" · ")}`);
  }

  console.log("\n" + "═".repeat(64));
  console.log("KURU ÇALIŞTIRMA — DB'ye hiçbir şey yazılmadı.");
  console.log("═".repeat(64));
}

main();
