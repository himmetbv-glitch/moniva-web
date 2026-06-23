import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2Bucket = process.env.R2_BUCKET ?? "";

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && r2Bucket);
}

let client: S3Client | null = null;
function r2(): S3Client {
  if (!isR2Configured()) throw new Error("R2 yapılandırılmamış (env eksik).");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

// DB'de saklanan, same-origin servis yolu (CDN'e geçişte tek nokta).
export function assetUrl(key: string): string {
  return `/api/r2/${key}`;
}

// "/api/r2/products/x/y.webp" -> "products/x/y.webp"
export function keyFromAssetUrl(url: string): string | null {
  const m = url.match(/^\/api\/r2\/(.+)$/);
  return m ? m[1] : null;
}

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObject(key: string): Promise<GetObjectCommandOutput> {
  return r2().send(new GetObjectCommand({ Bucket: r2Bucket, Key: key }));
}

export async function deleteObject(key: string): Promise<void> {
  await r2().send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
}
