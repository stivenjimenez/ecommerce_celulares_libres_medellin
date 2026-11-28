import { createClient } from "@supabase/supabase-js";
import { and, isNull, sql } from "drizzle-orm";

import { products } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/domain/product-images";

export function canManageProductImages(userId: string) {
  return (process.env.PRODUCT_IMAGE_ADMIN_IDS ?? "")
    .split(",")
    .some((id) => id.trim() === userId);
}

export function getProductImageBucket() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_STORAGE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Falta configurar la conexión a Supabase Storage.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(PRODUCT_IMAGES_BUCKET);
}

function getManagedImagePath(value: string): string | null {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return null;

  const prefix = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

  try {
    const url = new URL(value);
    if (url.origin !== new URL(projectUrl).origin || url.search || url.hash) {
      return null;
    }
    if (!url.pathname.startsWith(prefix)) return null;

    const path = url.pathname.slice(prefix.length);
    return /^(uploads|cloudinary)\/[a-z0-9-]+\.webp$/.test(path) ? path : null;
  } catch {
    return null;
  }
}

export async function deleteUnusedProductImages(imageUrls: string[]) {
  const managedImages = new Map<string, string>();
  for (const url of imageUrls) {
    const path = getManagedImagePath(url);
    if (path) managedImages.set(url, path);
  }

  if (managedImages.size === 0) return;

  const imageArray = sql`ARRAY[${sql.join(
    [...managedImages.keys()].map((url) => sql`${url}`),
    sql`, `,
  )}]::text[]`;
  const rows = await getDb()
    .select({ images: products.images })
    .from(products)
    .where(
      and(isNull(products.deletedAt), sql`${products.images} && ${imageArray}`),
    );

  for (const row of rows) {
    for (const url of row.images) managedImages.delete(url);
  }

  if (managedImages.size === 0) return;
  const { error } = await getProductImageBucket().remove([
    ...managedImages.values(),
  ]);
  if (error) throw error;
}
