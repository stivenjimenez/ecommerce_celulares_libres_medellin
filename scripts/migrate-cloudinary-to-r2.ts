import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

import { products } from "../db/schema";
import { getDb, hasDatabaseConnection } from "../lib/db/client";
import { CLOUDINARY_LOGO_URL } from "../lib/media/public-assets";
import { extractPublicIdFromCloudinaryUrl } from "../lib/server/cloudinary-admin";
import {
  getR2BucketName,
  getR2Client,
  getR2PublicBaseUrl,
  isR2Configured,
  publicUrlForKey,
  R2_IMAGE_CACHE_CONTROL,
} from "../lib/server/r2-client";

class MigrationError extends Error {}

type MigrationMode =
  { mode: "dry-run" | "apply" } | { mode: "rollback"; path: string };

type ProductImages = { productId: string; images: string[] };
type ImageMapping = { oldUrl: string; newUrl: string; key: string };

const contentTypes = new Map([
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".gif", "image/gif"],
  [".heic", "image/heic"],
  [".heif", "image/heif"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
  [".webp", "image/webp"],
]);

function parseArgs(args: string[]): MigrationMode {
  // pnpm may forward the option separator to the script.
  const [flag, path, ...rest] = args[0] === "--" ? args.slice(1) : args;
  if (!flag || (flag === "--dry-run" && !path)) return { mode: "dry-run" };
  if (flag === "--apply" && !path) return { mode: "apply" };
  if (flag === "--rollback" && path && !path.startsWith("--") && !rest.length) {
    return { mode: "rollback", path };
  }
  throw new MigrationError(
    "Uso: pnpm migrate:r2 [--dry-run | --apply | --rollback <ruta>]",
  );
}

function planImages(rows: ProductImages[]): ImageMapping[] {
  const urls = new Set(rows.flatMap(({ images }) => images));
  urls.add(CLOUDINARY_LOGO_URL);
  const mappings = new Map<string, ImageMapping>();

  for (const oldUrl of urls) {
    let source: URL;
    try {
      source = new URL(oldUrl);
    } catch {
      continue;
    }
    if (source.hostname !== "res.cloudinary.com") continue;

    const publicId = extractPublicIdFromCloudinaryUrl(oldUrl);
    if (
      !publicId ||
      source.protocol !== "https:" ||
      source.username ||
      source.password ||
      source.port
    ) {
      throw new MigrationError(
        `URL de Cloudinary no compatible: ${source.pathname}`,
      );
    }
    const extension = extname(
      decodeURIComponent(source.pathname.split("/").at(-1) ?? ""),
    );
    const key = publicId + extension;
    if (mappings.has(key)) {
      throw new MigrationError(
        `Varias URLs de Cloudinary corresponden a la misma clave R2: ${key}`,
      );
    }
    mappings.set(key, { oldUrl, key, newUrl: publicUrlForKey(key) });
  }

  return [...mappings.values()];
}

async function copyImage({ key, oldUrl }: ImageMapping, bucket: string) {
  const client = getR2Client();
  const object = { Bucket: bucket, Key: key };
  try {
    await client.send(new HeadObjectCommand(object));
    return "ya existe";
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("$metadata" in error) ||
      (error.$metadata as { httpStatusCode?: number } | undefined)
        ?.httpStatusCode !== 404
    ) {
      throw new MigrationError(`No se pudo comprobar el objeto R2: ${key}`);
    }
  }

  let response: Response;
  let body: Buffer;
  try {
    response = await fetch(oldUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error();
    body = Buffer.from(await response.arrayBuffer());
  } catch {
    throw new MigrationError(
      `No se pudo descargar la imagen de Cloudinary: ${key}`,
    );
  }

  const ContentType =
    response.headers.get("content-type") ||
    contentTypes.get(extname(key).toLowerCase()) ||
    "application/octet-stream";

  try {
    await client.send(
      new PutObjectCommand({
        ...object,
        Body: body,
        ContentType,
        CacheControl: R2_IMAGE_CACHE_CONTROL,
        IfNoneMatch: "*",
      }),
    );
  } catch (error) {
    // Another migration may have copied this key after our HEAD.
    if (error instanceof Error && error.name === "PreconditionFailed") {
      return "ya existe";
    }
    throw new MigrationError(`No se pudo subir la imagen a R2: ${key}`);
  }
  return "copiado";
}

async function verifyImage({ key, newUrl }: ImageMapping) {
  let response: Response;
  try {
    response = await fetch(newUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new MigrationError(
      `No se pudo verificar la URL pública de R2: ${key}`,
    );
  }
  if (response.status !== 200) {
    throw new MigrationError(
      `R2 respondió HTTP ${response.status} para la URL pública de ${key}`,
    );
  }
}

function isProductImages(value: unknown): value is ProductImages {
  return (
    typeof value === "object" &&
    value !== null &&
    "productId" in value &&
    typeof value.productId === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.productId) &&
    "images" in value &&
    Array.isArray(value.images) &&
    value.images.every((image: unknown) => typeof image === "string")
  );
}

function isUrlMap(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((url) => typeof url === "string")
  );
}

async function readBackup(path: string) {
  let backup: unknown;
  try {
    backup = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new MigrationError("No se pudo leer el respaldo JSON.");
  }
  if (
    typeof backup !== "object" ||
    backup === null ||
    !("products" in backup) ||
    !Array.isArray(backup.products) ||
    !backup.products.every(isProductImages) ||
    !("urlMap" in backup) ||
    !isUrlMap(backup.urlMap)
  ) {
    throw new MigrationError("El respaldo JSON tiene un formato inválido.");
  }
  return {
    rows: backup.products,
    urls: new Map(Object.entries(backup.urlMap)),
  };
}

function sameImages(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((url, index) => url === right[index])
  );
}

async function updateImages(
  db: ReturnType<typeof getDb>,
  rows: ProductImages[],
  urls: Map<string, string>,
  rollback = false,
) {
  return db.transaction(async (tx) => {
    let changed = 0;
    for (const { productId, images } of rows) {
      const migrated = images.map((url) => urls.get(url) ?? url);
      if (sameImages(images, migrated)) continue;

      const previous = rollback ? migrated : images;
      const next = rollback ? images : migrated;
      const updated = await tx
        .update(products)
        .set({ images: next, updatedAt: new Date() })
        .where(and(eq(products.id, productId), eq(products.images, previous)))
        .returning({ id: products.id });
      if (updated.length > 0) {
        changed += 1;
        continue;
      }

      const [current] = await tx
        .select({ images: products.images })
        .from(products)
        .where(eq(products.id, productId));
      if (!current || !sameImages(current.images, next)) {
        throw new MigrationError(
          `Las imágenes del producto ${productId} cambiaron desde el respaldo. Se canceló la transacción.`,
        );
      }
    }
    return changed;
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  config({ path: ".env.local", quiet: true });

  if (!hasDatabaseConnection()) {
    throw new MigrationError(
      "Configura DATABASE_URL, SUPABASE_DB_URL o POSTGRES_URL.",
    );
  }

  const db = getDb();
  try {
    if (options.mode === "rollback") {
      const { rows, urls } = await readBackup(options.path);
      const count = await updateImages(db, rows, urls, true);
      console.log(`Productos restaurados: ${count}.`);
      return;
    }

    const publicBaseUrl = getR2PublicBaseUrl();
    if (!publicBaseUrl) {
      throw new MigrationError(
        "Configura NEXT_PUBLIC_R2_PUBLIC_URL con una URL HTTPS pública válida.",
      );
    }
    if (options.mode === "apply" && !isR2Configured()) {
      throw new MigrationError(
        "Configura R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET_NAME para aplicar la migración.",
      );
    }

    const rows = await db
      .select({ productId: products.id, images: products.images })
      .from(products)
      .orderBy(products.id);
    const mappings = planImages(rows);
    const urls = new Map(
      mappings.map(({ oldUrl, newUrl }) => [oldUrl, newUrl]),
    );
    const createdAt = new Date().toISOString();
    const directory = resolve("scripts/backups");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const path = resolve(
      directory,
      `${createdAt.replaceAll(":", "-")}-${randomUUID()}.backup.json`,
    );
    await writeFile(
      path,
      JSON.stringify(
        {
          metadata: { createdAt, mode: options.mode, publicBaseUrl },
          products: rows,
          urlMap: Object.fromEntries(urls),
        },
        null,
        2,
      ) + "\n",
      { flag: "wx", mode: 0o600, flush: true },
    );

    const affected = rows.filter(({ images }) =>
      images.some((url) => urls.has(url)),
    );
    console.log(
      `${options.mode}: ${rows.length} productos, ${affected.length} con cambios, ${mappings.length} imágenes de Cloudinary (incluido el logo).`,
    );
    console.log(`Respaldo: ${path}`);
    for (const { oldUrl, newUrl } of mappings.slice(0, 5)) {
      console.log(`  ${new URL(oldUrl).pathname} → ${newUrl}`);
    }
    if (options.mode === "dry-run") return;

    const bucket = getR2BucketName();
    for (const [index, mapping] of mappings.entries()) {
      const result = await copyImage(mapping, bucket);
      console.log(
        `[${index + 1}/${mappings.length}] ${mapping.key}: ${result}`,
      );
    }

    console.log("Verificando las URLs públicas de R2…");
    for (const mapping of mappings) await verifyImage(mapping);

    const count = await updateImages(db, affected, urls);
    console.log(`Productos actualizados: ${count}.`);
  } finally {
    await db.$client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  // Driver errors can contain SQL parameters or connection details.
  console.error(
    error instanceof MigrationError
      ? error.message
      : "Falló la migración. Revisa la configuración y vuelve a intentarlo.",
  );
  process.exitCode = 1;
});
