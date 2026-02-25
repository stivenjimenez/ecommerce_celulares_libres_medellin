import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { productCategories, type Product, type ProductCategory } from "@/lib/domain/product";

const GENERATED_PATH = resolve(process.cwd(), "data/products.generated.json");
const DEFAULT_PATH = resolve(process.cwd(), "data/products.json");

type ProductInput = Partial<Product>;

export class SlugConflictError extends Error {
  constructor(message = "Ya existe un producto con ese slug.") {
    super(message);
    this.name = "SlugConflictError";
  }
}

function isProductCategory(value: string): value is ProductCategory {
  return (productCategories as readonly string[]).includes(value);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function safeBoolean(value: unknown): boolean {
  return value === true;
}

function safeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function safeObject(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, val]) => {
    return ["string", "number", "boolean"].includes(typeof val);
  }) as [string, string | number | boolean][];

  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function safeVariants(value: unknown): Product["variants"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const source = value as Record<string, unknown>;
  const color = Array.isArray(source.color)
    ? source.color.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;
  const size = Array.isArray(source.size)
    ? source.size.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;

  if (!color && !size) return undefined;
  return { color, size };
}

function normalizeProduct(input: ProductInput, existing?: Product): Product {
  const name = safeString(input.name) || existing?.name || "Producto sin nombre";
  const categorySource = safeString(input.category);
  const category = isProductCategory(categorySource)
    ? categorySource
    : (existing?.category ?? "technology");
  const providedSlug = safeString(input.slug);
  const slugCandidate = slugify(providedSlug || name) || safeString(existing?.slug);
  const description = safeText(input.description) ?? existing?.description ?? "";

  return {
    id: safeString(input.id) || existing?.id || randomUUID(),
    slug: slugCandidate || randomUUID(),
    name,
    description,
    price: safeNumber(input.price ?? existing?.price),
    images: safeImages(input.images).length > 0 ? safeImages(input.images) : (existing?.images ?? []),
    category,
    featured: safeBoolean(input.featured ?? existing?.featured),
    draft: safeBoolean(input.draft ?? existing?.draft),
    variants: safeVariants(input.variants ?? existing?.variants),
    attributes: safeObject(input.attributes ?? existing?.attributes),
  };
}

async function readCatalogFile(path: string): Promise<Product[] | null> {
  try {
    const content = await readFile(path, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => normalizeProduct(item as ProductInput));
  } catch {
    return null;
  }
}

async function getCatalogTargetPath(): Promise<string> {
  const generated = await readCatalogFile(GENERATED_PATH);
  if (generated) {
    return GENERATED_PATH;
  }

  const fallback = await readCatalogFile(DEFAULT_PATH);
  if (fallback) {
    return DEFAULT_PATH;
  }

  return GENERATED_PATH;
}

async function persist(path: string, products: Product[]): Promise<void> {
  await writeFile(path, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

export async function getEditableCatalog(): Promise<{ path: string; products: Product[] }> {
  const path = await getCatalogTargetPath();
  const products = (await readCatalogFile(path)) ?? [];
  return { path, products };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { path, products } = await getEditableCatalog();
  const product = normalizeProduct(input);

  if (products.some((item) => item.id === product.id)) {
    product.id = randomUUID();
  }

  if (products.some((item) => item.slug === product.slug)) {
    throw new SlugConflictError();
  }

  const next = [product, ...products];
  await persist(path, next);
  return product;
}

export async function updateProduct(input: ProductInput): Promise<Product | null> {
  const id = safeString(input.id);
  if (!id) return null;

  const { path, products } = await getEditableCatalog();
  const index = products.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const current = products[index];
  const updated = normalizeProduct({ ...current, ...input }, current);

  const hasSlugCollision = products.some((item) => item.id !== id && item.slug === updated.slug);
  if (hasSlugCollision) {
    throw new SlugConflictError();
  }

  const next = [...products];
  next[index] = updated;
  await persist(path, next);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const cleanId = safeString(id);
  if (!cleanId) return false;

  const { path, products } = await getEditableCatalog();
  const next = products.filter((item) => item.id !== cleanId);

  if (next.length === products.length) return false;

  await persist(path, next);
  return true;
}

export async function reorderProducts(productIds: string[]): Promise<Product[]> {
  const { path, products } = await getEditableCatalog();
  const cleanIds = productIds.map((id) => safeString(id)).filter((id) => id.length > 0);
  if (cleanIds.length === 0) return products;

  const productById = new Map(products.map((product) => [product.id, product]));
  const seen = new Set<string>();
  const reordered: Product[] = [];

  for (const id of cleanIds) {
    const product = productById.get(id);
    if (!product || seen.has(id)) continue;
    reordered.push(product);
    seen.add(id);
  }

  for (const product of products) {
    if (seen.has(product.id)) continue;
    reordered.push(product);
  }

  await persist(path, reordered);
  return reordered;
}
