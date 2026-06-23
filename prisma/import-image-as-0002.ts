import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";

// .env.local'i elle yükle (standalone tsx otomatik okumaz).
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const SKU = "MNV-AS-0002";
const SRC = "/tmp/mnv3.jpg"; // önceden indirilen kaynak görsel (JPEG 500x500)

async function main() {
  const product = await prisma.product.findUnique({
    where: { sku: SKU },
    select: { id: true, translations: { where: { locale: "TR" }, select: { name: true } } },
  });
  if (!product) throw new Error(`${SKU} bulunamadı`);

  const existing = await prisma.productImage.count({ where: { productId: product.id } });
  if (existing > 0) {
    console.log(`Üründe zaten ${existing} görsel var — atlandı.`);
    return;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !bucket || !process.env.R2_ACCESS_KEY_ID) {
    throw new Error("R2 env eksik (.env.local okunamadı).");
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bytes = readFileSync(SRC);
  const key = `products/${product.id}/${randomUUID()}.jpg`;

  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: "image/jpeg" }),
  );

  const created = await prisma.productImage.create({
    data: {
      productId: product.id,
      url: `/api/r2/${key}`,
      alt: product.translations[0]?.name ?? SKU,
      order: 0,
      isMain: true,
    },
    select: { id: true, url: true, isMain: true },
  });

  console.log(`OK — görsel yüklendi ve kaydedildi.\n  R2 key: ${key}\n  url: ${created.url}\n  isMain: ${created.isMain}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
