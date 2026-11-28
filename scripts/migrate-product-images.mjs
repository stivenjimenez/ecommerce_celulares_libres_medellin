import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
const [mode, directory, backupFile] = process.argv.slice(2);
if (
  !["prepare", "upload", "switch", "restore"].includes(mode) ||
  !directory ||
  (mode === "restore" && !backupFile)
) {
  console.error(
    "Uso: node scripts/migrate-product-images.mjs prepare|upload|switch|restore <directorio> [respaldo]",
  );
  process.exit(1);
}

const bucketName = "product-images";
const maxImageBytes = 1024 * 1024;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const connectionString =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.POSTGRES_URL;
if (mode !== "upload" && !connectionString) {
  throw new Error("Falta DATABASE_URL.");
}
const db =
  mode === "upload"
    ? null
    : postgres(connectionString, { max: 1, connect_timeout: 10 });
const manifestPath = join(directory, "manifest.json");

function isCloudinary(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readProducts(sql) {
  return sql`select id, draft, images from public.products where deleted_at is null order by id`;
}

async function processBatch(values, callback) {
  let next = 0;
  const failures = [];
  const workers = Array.from(
    { length: Math.min(values.length, 6) },
    async () => {
      while (next < values.length) {
        const index = next++;
        try {
          await callback(values[index]);
        } catch (error) {
          failures.push(error);
          console.error(error.message);
        }
      }
    },
  );

  await Promise.all(workers);
  if (failures.length) throw new Error(`${failures.length} imágenes fallaron.`);
}

async function prepare() {
  const require = createRequire(import.meta.url);
  const requireFromNext = createRequire(require.resolve("next/package.json"));
  const sharp = requireFromNext("sharp");
  const products = await readProducts(db);
  const sourceUrls = [
    ...new Set(products.flatMap(({ images }) => images.filter(isCloudinary))),
  ];
  const assets = new Map();
  await mkdir(directory, { recursive: true, mode: 0o700 });

  await processBatch(sourceUrls, async (source) => {
    const response = await fetch(source, {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
    if (!response.headers.get("content-type")?.startsWith("image/")) {
      throw new Error(`${source}: el origen no devolvió una imagen.`);
    }
    const input = Buffer.from(await response.arrayBuffer());
    const image = sharp(input, { animated: true }).autoOrient().resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    });

    for (const quality of [80, 72, 64, 56]) {
      const webp = await image.webp({ quality }).toBuffer();
      if (webp.length > maxImageBytes) continue;
      const hash = sha256(webp);
      await writeFile(join(directory, `${hash}.webp`), webp);
      assets.set(source, {
        hash,
        bytes: webp.length,
        sourceBytes: input.length,
      });
      return;
    }
    throw new Error(`${source}: supera 1 MiB después de comprimir.`);
  });

  const manifest = sourceUrls.map((source) => ({
    source,
    ...assets.get(source),
  }));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", {
    mode: 0o600,
  });
  const unique = [
    ...new Map(manifest.map((asset) => [asset.hash, asset])).values(),
  ];
  console.log({
    sourceUrls: sourceUrls.length,
    uniqueWebp: unique.length,
    sourceBytes: manifest.reduce(
      (total, asset) => total + asset.sourceBytes,
      0,
    ),
    webpBytes: unique.reduce((total, asset) => total + asset.bytes, 0),
  });
}

function destination(hash) {
  if (!projectUrl) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");
  if (!/^[a-f0-9]{64}$/.test(hash))
    throw new Error("Hash incorrecto en el manifiesto.");
  const path = `cloudinary/${hash}.webp`;
  return {
    path,
    url: new URL(`/storage/v1/object/public/${bucketName}/${path}`, projectUrl)
      .href,
  };
}

async function verifyObject({ url }, asset) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (
    !response.ok ||
    sha256(Buffer.from(await response.arrayBuffer())) !== asset.hash
  ) {
    throw new Error(
      `${url}: la copia pública no coincide con la imagen preparada.`,
    );
  }
}

async function upload(manifest) {
  const key = process.env.SUPABASE_STORAGE_SECRET_KEY;
  if (!projectUrl || !key)
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_STORAGE_SECRET_KEY.",
    );

  const { createClient } = await import("@supabase/supabase-js");
  const storage = createClient(projectUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
  const { error: createError } = await storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: maxImageBytes,
    allowedMimeTypes: ["image/webp"],
  });
  if (createError) {
    const { data, error } = await storage.getBucket(bucketName);
    if (
      error ||
      !data.public ||
      data.file_size_limit !== maxImageBytes ||
      data.allowed_mime_types?.join(",") !== "image/webp"
    ) {
      throw new Error(
        `No se pudo configurar el bucket ${bucketName}: ${createError.message}`,
      );
    }
  }

  const bucket = storage.from(bucketName);
  const unique = [
    ...new Map(manifest.map((asset) => [asset.hash, asset])).values(),
  ];
  await processBatch(unique, async (asset) => {
    const target = destination(asset.hash);
    const bytes = await readFile(join(directory, `${asset.hash}.webp`));
    if (sha256(bytes) !== asset.hash)
      throw new Error(`Archivo local incorrecto: ${asset.hash}.`);

    const { error } = await bucket.upload(target.path, bytes, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    try {
      await verifyObject(target, asset);
    } catch (verificationError) {
      if (error) throw new Error(`${target.path}: ${error.message}`);
      throw verificationError;
    }
  });
  console.log(`${unique.length} archivos WebP subidos y verificados.`);
}

async function switchCatalog(manifest) {
  const replacements = new Map(
    manifest.map((asset) => [asset.source, destination(asset.hash).url]),
  );
  const unique = [
    ...new Map(manifest.map((asset) => [asset.hash, asset])).values(),
  ];
  await processBatch(unique, (asset) =>
    verifyObject(destination(asset.hash), asset),
  );

  const backupPath = join(directory, `catalog-before-${Date.now()}.json`);
  const changed = await db.begin(async (tx) => {
    await tx`set local lock_timeout = '5s'`;
    await tx`lock table public.products in share row exclusive mode`;
    const rows = await readProducts(tx);
    const updates = rows
      .filter(({ images }) => images.some(isCloudinary))
      .map(({ id, images }) => ({
        id,
        before: images,
        after: images.map((source) => {
          if (!isCloudinary(source)) return source;
          const url = replacements.get(source);
          if (!url)
            throw new Error(
              `Falta preparar una URL nueva en el producto ${id}.`,
            );
          return url;
        }),
      }));

    if (updates.length > 0) {
      await writeFile(backupPath, JSON.stringify(updates, null, 2) + "\n", {
        mode: 0o600,
        flag: "wx",
      });
    }
    for (const { id, after } of updates) {
      await tx`update public.products set images = ${tx.array(after)}::text[] where id = ${id}`;
    }
    return updates.length;
  });

  console.log(`${changed} productos actualizados.`);
  if (changed > 0) console.log(`Respaldo: ${backupPath}`);
}

async function restoreCatalog() {
  const backup = JSON.parse(await readFile(backupFile, "utf8"));
  const restored = await db.begin(async (tx) => {
    let count = 0;
    for (const { id, before, after } of backup) {
      const result = await tx`
        update public.products set images = ${tx.array(before)}::text[]
        where id = ${id} and deleted_at is null and images = ${tx.array(after)}::text[]
      `;
      count += result.count;
    }
    return count;
  });
  console.log(
    `${restored} productos restaurados; ${backup.length - restored} ya no coincidían con el respaldo.`,
  );
}

try {
  if (mode === "prepare") {
    await prepare();
  } else if (mode === "restore") {
    await restoreCatalog();
  } else {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!Array.isArray(manifest)) throw new Error("Manifiesto inválido.");
    if (mode === "upload") await upload(manifest);
    if (mode === "switch") await switchCatalog(manifest);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db?.end();
}
