// Counts the Prisma round-trips one page request costs, cold vs warm.
// Start the server with Prisma's debug log going to a file, e.g.
//   DEBUG="prisma*" PORT=3100 npx next start > /tmp/srv.log 2>&1
// then: LOG=/tmp/srv.log BASE=http://localhost:3100 npx tsx scripts/e2e/cache-query-count.mts
// Each "libraryEngine sending" line is one client → engine call.
import { readFileSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
const log = process.env.LOG;
if (!log) throw new Error("LOG=<server log file> is required");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sends = () => (readFileSync(log, "utf8").match(/libraryEngine sending/g) ?? []).length;

async function measure(path: string): Promise<number> {
  const before = sends();
  const res = await fetch(base + path, {
    headers: { "user-agent": "Mozilla/5.0 Chrome/129" },
    redirect: "manual",
  });
  await res.text();
  if (res.status !== 200 && res.status !== 404) throw new Error(`${path} → ${res.status}`);
  await sleep(Number(process.env.SETTLE_MS ?? 600));
  return sends() - before;
}

const cat = process.env.CAT ?? "air-suspension";
const slug = process.env.SLUG ?? "dorse-di-ngi-l-yayi-ci-vatali-fruehauf-jumbo-k-i-nce";

const cases: [string, string][] = [
  ["vitrin /tr/urunler", "/tr/urunler"],
  ["vitrin /tr/urunler (tekrar)", "/tr/urunler"],
  ["tüm ürünler ?tum=1", "/tr/urunler?tum=1"],
  ["tüm ürünler ?tum=1 (tekrar)", "/tr/urunler?tum=1"],
  ["kategori", `/tr/urunler?kategori=${cat}`],
  ["kategori (tekrar)", `/tr/urunler?kategori=${cat}`],
  ["kategori + çöp param + sahte marka", `/tr/urunler?utm_source=x&kategori=${cat}&marka=yok-boyle`],
  ["kategori + sayfa=99999", `/tr/urunler?kategori=${cat}&sayfa=99999`],
  ["?tum=1&sirala=ad", "/tr/urunler?tum=1&sirala=ad"],
  ["?tum=1&sirala=ad (tekrar)", "/tr/urunler?tum=1&sirala=ad"],
  ["arama q=Kaliper", "/tr/urunler?q=Kaliper"],
  ["arama q=kaliper (normalize → aynı girdi)", "/tr/urunler?q=%20kaliper%20"],
  ["ürün detay", `/tr/urunler/${slug}`],
  ["ürün detay (tekrar)", `/tr/urunler/${slug}`],
  ["ürün detay /en (tekrar sayılmaz, ilk)", `/en/urunler/${slug}`],
  ["ürün detay /en (tekrar)", `/en/urunler/${slug}`],
];

for (const [label, path] of cases) {
  console.log(`${String(await measure(path)).padStart(4)}  ${label}`);
}
