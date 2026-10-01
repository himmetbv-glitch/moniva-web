/**
 * Anasayfa hero'suna YouTube arka plan videosu bağlar (firma talebi 2026-10-02:
 * slider kalkacak, yerine video). Yalnız `home/hero.data.videoUrl` yazılır;
 * slaytlar silinmez — alan boşaltılırsa slider geri gelir.
 *
 * Kullanım:
 *   TARGET_DATABASE_URL="postgres://…" npx tsx --env-file=.env \
 *     prisma/import/set-hero-video.ts [--url=https://…] [--dry-run]
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { writeFileSync } from "node:fs";

import { youtubeId } from "../../src/lib/pages/home-sections";

const DRY = process.argv.includes("--dry-run");
const URL_ARG = process.argv.find((a) => a.startsWith("--url="))?.slice(6);
const VIDEO_URL = URL_ARG ?? "https://www.youtube.com/watch?v=58ztLwNRhmU";

const prisma = new PrismaClient({ datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL });

async function main() {
  if (VIDEO_URL && !youtubeId(VIDEO_URL)) throw new Error(`Not a YouTube URL: ${VIDEO_URL}`);
  const section = await prisma.pageSection.findFirst({
    where: { key: "hero", page: { key: "home" } },
    select: { id: true, data: true },
  });
  if (!section) throw new Error("home/hero section not found");

  const before = section.data as Record<string, unknown>;
  const changed = before.videoUrl !== VIDEO_URL;
  console.log({ from: before.videoUrl ?? null, to: VIDEO_URL, id: youtubeId(VIDEO_URL), changed });
  if (DRY || !changed) return;

  const backup = `/tmp/home-hero-backup-${Date.now()}.json`;
  writeFileSync(backup, JSON.stringify({ id: section.id, data: before }, null, 1));
  await prisma.pageSection.update({
    where: { id: section.id },
    data: { data: { ...before, videoUrl: VIDEO_URL } as Prisma.InputJsonValue },
  });
  console.log("updated; backup:", backup);
}

main().finally(() => prisma.$disconnect());
