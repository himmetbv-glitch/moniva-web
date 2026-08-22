/**
 * Katalog PDF'lerinin ilk sayfasından üretilen JPEG kapakları R2'ye yükler
 * ve Catalogue.coverImage alanını bağlar. (Kapaklar qlmanage + sips ile
 * scratchpad/covers/ altına çıkarılmış olmalı — bkz. replace-catalogues.ts.)
 *
 * Idempotent: R2'de aynı boyutta nesne varsa yükleme atlanır; DB'de aynı
 * URL varsa update edilmez.
 *
 * Kullanım:
 *   COVERS_DIR="<jpeg klasörü>" TARGET_DATABASE_URL="postgres://…" \
 *     npx tsx --env-file=.env --env-file=.env.local prisma/import/set-catalogue-covers.ts
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.COVERS_DIR;
if (!DIR) {
  console.error("COVERS_DIR env gerekli.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL,
});
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const bucket = process.env.R2_BUCKET!;

async function existsInR2(key: string, size: number): Promise<boolean> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength === size;
  } catch {
    return false;
  }
}

async function main() {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";
  console.log(`Hedef DB: ${url.includes("localhost") ? "YEREL" : "UZAK (Neon)"}\n`);

  for (const f of readdirSync(DIR).filter((x) => x.endsWith(".jpg"))) {
    const slug = f.replace(/\.jpg$/, "");
    const cat = await prisma.catalogue.findUnique({ where: { slug }, select: { id: true, coverImage: true } });
    if (!cat) {
      console.log(`  ${slug}: katalog yok — atlandı`);
      continue;
    }
    const path = join(DIR, f);
    const size = statSync(path).size;
    const key = `catalogues/covers/${slug}.jpg`;
    const cover = `/api/r2/${key}`;

    let up = "zaten var";
    if (!(await existsInR2(key, size))) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: readFileSync(path),
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      up = "yüklendi";
    }
    if (cat.coverImage !== cover) {
      await prisma.catalogue.update({ where: { id: cat.id }, data: { coverImage: cover } });
      console.log(`  ${slug}: R2 ${up}, coverImage bağlandı`);
    } else {
      console.log(`  ${slug}: R2 ${up}, coverImage zaten doğru`);
    }
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
