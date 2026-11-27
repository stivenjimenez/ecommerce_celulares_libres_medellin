import { S3Client } from "@aws-sdk/client-s3";

import { getR2PublicBaseUrl } from "../media/public-assets";

export { getR2PublicBaseUrl };

export const R2_IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName)
    return null;
  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export function isR2Configured(): boolean {
  return Boolean(getR2Config() && getR2PublicBaseUrl());
}

function requireR2Config() {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      "Falta configurar R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY o R2_BUCKET_NAME.",
    );
  }
  return config;
}

export function getR2BucketName(): string {
  return requireR2Config().bucketName;
}

let client: S3Client | undefined;

export function getR2Client(): S3Client {
  const { accountId, accessKeyId, secretAccessKey } = requireR2Config();
  client ??= new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return client;
}

export function publicUrlForKey(key: string): string {
  const base = getR2PublicBaseUrl();
  if (!base) {
    throw new Error(
      "Configura NEXT_PUBLIC_R2_PUBLIC_URL con una URL HTTPS pública válida.",
    );
  }
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function objectKeyFromPublicUrl(url: string): string | null {
  const base = getR2PublicBaseUrl();
  if (!base) return null;

  try {
    const parsed = new URL(url);
    const prefix = `${base}/`;
    const location = `${parsed.origin}${parsed.pathname}`;
    if (parsed.username || parsed.password || !location.startsWith(prefix)) {
      return null;
    }
    return decodeURIComponent(location.slice(prefix.length)) || null;
  } catch {
    return null;
  }
}
