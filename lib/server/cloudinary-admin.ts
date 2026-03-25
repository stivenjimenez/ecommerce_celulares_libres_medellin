import { createHash } from "node:crypto";

import { and, isNull, sql } from "drizzle-orm";

import { products } from "@/db/schema";
import { getDb } from "@/lib/db/client";

type CloudinaryDestroyResponse = {
  result?: string;
  error?: { message?: string };
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "dwqyypb8q";
const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";

function makeSignature(params: Record<string, string>, secret: string): string {
  const toSign = Object.entries(params)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

function ensureCloudinaryDestroyConfig() {
  if (!apiKey || !apiSecret) {
    throw new Error(
      "Para eliminar imágenes de Cloudinary define CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.",
    );
  }
}

function isTransformationSegment(segment: string): boolean {
  return /^[a-z]{1,3}_/.test(segment);
}

function extractPublicIdFromCloudinaryUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (pathSegments[0] !== cloudName) return null;

    const uploadIndex = pathSegments.findIndex(
      (segment, index) =>
        segment === "upload" && pathSegments[index - 1] === "image",
    );
    if (uploadIndex === -1) return null;

    let assetSegments = pathSegments.slice(uploadIndex + 1);
    while (assetSegments[0] && isTransformationSegment(assetSegments[0])) {
      assetSegments = assetSegments.slice(1);
    }

    if (assetSegments[0] && /^v\d+$/.test(assetSegments[0])) {
      assetSegments = assetSegments.slice(1);
    }

    if (assetSegments.length === 0) return null;

    const lastSegment = assetSegments[assetSegments.length - 1] ?? "";
    const extensionIndex = lastSegment.lastIndexOf(".");
    if (extensionIndex > 0) {
      assetSegments[assetSegments.length - 1] = lastSegment.slice(
        0,
        extensionIndex,
      );
    }

    const publicId = assetSegments.join("/");
    return publicId || null;
  } catch {
    return null;
  }
}

async function getStillReferencedUrls(
  imageUrls: string[],
  excludingProductId?: string,
): Promise<Set<string>> {
  if (imageUrls.length === 0) return new Set<string>();
  const imageUrlsSql = sql`ARRAY[${sql.join(
    imageUrls.map((imageUrl) => sql`${imageUrl}`),
    sql`, `,
  )}]::text[]`;

  const rows = await getDb()
    .select({ images: products.images })
    .from(products)
    .where(
      excludingProductId
        ? and(
            isNull(products.deletedAt),
            sql`${products.id} <> ${excludingProductId}`,
            sql`${products.images} && ${imageUrlsSql}`,
          )
        : and(
            isNull(products.deletedAt),
            sql`${products.images} && ${imageUrlsSql}`,
          ),
    );

  const referenced = new Set<string>();
  for (const row of rows) {
    for (const image of row.images) {
      if (imageUrls.includes(image)) {
        referenced.add(image);
      }
    }
  }

  return referenced;
}

async function destroyCloudinaryAsset(publicId: string): Promise<void> {
  ensureCloudinaryDestroyConfig();

  const timestamp = String(Math.floor(Date.now() / 1000));
  const paramsToSign = {
    invalidate: "true",
    public_id: publicId,
    timestamp,
  };
  const signature = makeSignature(paramsToSign, apiSecret);
  const body = new URLSearchParams({
    ...paramsToSign,
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  const payload = (await response
    .json()
    .catch(() => null)) as CloudinaryDestroyResponse | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Cloudinary no pudo eliminar la imagen.",
    );
  }

  if (payload?.result && !["ok", "not found"].includes(payload.result)) {
    throw new Error(
      "Cloudinary devolvió una respuesta inesperada al eliminar.",
    );
  }
}

export async function deleteUnusedCloudinaryImages(
  imageUrls: string[],
  excludingProductId?: string,
): Promise<void> {
  const uniqueUrls = [...new Set(imageUrls.filter(Boolean))];
  if (uniqueUrls.length === 0) return;

  const stillReferenced = await getStillReferencedUrls(
    uniqueUrls,
    excludingProductId,
  );
  const publicIdsToDelete = uniqueUrls
    .filter((url) => !stillReferenced.has(url))
    .map(extractPublicIdFromCloudinaryUrl)
    .filter((publicId): publicId is string => Boolean(publicId));

  if (publicIdsToDelete.length === 0) return;

  await Promise.all(
    publicIdsToDelete.map((publicId) => destroyCloudinaryAsset(publicId)),
  );
}
