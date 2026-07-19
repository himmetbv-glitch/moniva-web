/**
 * OemReference.oemNumberNormalized boş olan tüm kayıtları doldurur.
 * Arama (getProducts) bu alan üzerinden çalıştığı için import sonrası backfill şart.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeOem(v: string): string {
  return v.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function main() {
  const empty = await prisma.oemReference.findMany({
    where: { oemNumberNormalized: "" },
    select: { id: true, oemNumber: true },
  });
  console.log(`Backfill hedefi: ${empty.length} kayıt`);

  let ok = 0;
  for (let i = 0; i < empty.length; i++) {
    const r = empty[i];
    const norm = normalizeOem(r.oemNumber);
    if (!norm) continue; // tamamen boş/özel karakter
    await prisma.oemReference.update({
      where: { id: r.id },
      data: { oemNumberNormalized: norm },
    });
    ok++;
    if ((i + 1) % 500 === 0) console.log(`  ${i + 1}/${empty.length} işlendi`);
  }
  console.log(`\n✓ ${ok} kayıt güncellendi`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
