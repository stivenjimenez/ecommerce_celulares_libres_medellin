import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, isNull, ne } from "drizzle-orm";

import { products } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { SITE_LOGO_KEY } from "@/lib/media/public-assets";
import {
  getR2BucketName,
  getR2Client,
  isR2Configured,
  objectKeyFromPublicUrl,
  publicUrlForKey,
  R2_IMAGE_CACHE_CONTROL,
} from "@/lib/server/r2-client";

const extensionsByContentType = new Map([
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/bmp", ".bmp"],
  ["image/tiff", ".tiff"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
]);

export class InvalidR2ImageTypeError extends Error {
  constructor() {
    super("El formato de la imagen no es compatible con R2.");
  }
}

function createUpload(filename?: string, requestedContentType?: string) {
  const extension = extname(filename ?? "").toLowerCase();
  const inferredType = [...extensionsByContentType].find(
    ([, suffix]) => suffix === (extension === ".jpeg" ? ".jpg" : extension),
  )?.[0];
  const contentType =
    requestedContentType?.trim().toLowerCase() ||
    inferredType ||
    "application/octet-stream";
  const safeExtension = extensionsByContentType.get(contentType);
  if (!safeExtension && contentType !== "application/octet-stream") {
    throw new InvalidR2ImageTypeError();
  }

  const folder =
    process.env.R2_UPLOAD_FOLDER?.trim() || "celulares_libres_medellin";
  const segments = folder.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("R2_UPLOAD_FOLDER contiene un segmento de ruta inválido.");
  }

  const key = [...segments, `${randomUUID()}${safeExtension ?? ""}`].join("/");
  return {
    Bucket: getR2BucketName(),
    Key: key,
    ContentType: contentType,
    CacheControl: R2_IMAGE_CACHE_CONTROL,
  };
}

export async function signR2Upload(
  filename?: string,
  requestedContentType?: string,
) {
  const upload = createUpload(filename, requestedContentType);
  const publicUrl = publicUrlForKey(upload.Key);
  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand(upload),
    {
      expiresIn: 300,
      signableHeaders: new Set(["content-type", "cache-control"]),
    },
  );

  return {
    mode: "r2" as const,
    method: "PUT" as const,
    uploadUrl,
    publicUrl,
    key: upload.Key,
    contentType: upload.ContentType,
    headers: {
      "Content-Type": upload.ContentType,
      "Cache-Control": upload.CacheControl,
    },
  };
}

export async function uploadFileToR2(file: File): Promise<string> {
  const upload = createUpload(file.name, file.type);
  const publicUrl = publicUrlForKey(upload.Key);
  try {
    await getR2Client().send(
      new PutObjectCommand({
        ...upload,
        Body: Buffer.from(await file.arrayBuffer()),
      }),
    );
  } catch {
    throw new Error("No se pudo subir la imagen a R2.");
  }
  return publicUrl;
}

export async function deleteUnusedR2Images(
  imageUrls: string[],
  excludingProductId?: string,
): Promise<void> {
  if (!isR2Configured()) return;

  const keys = new Set<string>();
  for (const url of imageUrls) {
    const key = objectKeyFromPublicUrl(url);
    if (key && key !== SITE_LOGO_KEY) keys.add(key);
  }
  if (keys.size === 0) return;

  // Compare keys so a query string or alternate URL encoding still protects the object.
  const rows = await getDb()
    .select({ images: products.images })
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        excludingProductId ? ne(products.id, excludingProductId) : undefined,
      ),
    );
  for (const { images } of rows) {
    for (const image of images) {
      const key = objectKeyFromPublicUrl(image);
      if (key) keys.delete(key);
    }
    if (keys.size === 0) return;
  }

  const Bucket = getR2BucketName();
  const client = getR2Client();
  try {
    await Promise.all(
      [...keys].map((Key) =>
        client.send(new DeleteObjectCommand({ Bucket, Key })),
      ),
    );
  } catch {
    throw new Error("No se pudieron eliminar las imágenes de R2.");
  }
}
