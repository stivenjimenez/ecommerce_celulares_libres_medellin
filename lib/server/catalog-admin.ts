import { randomUUID } from "node:crypto";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { brands, categories, products, subcategories } from "@/db/schema";
import {
  productCategories,
  type Product,
  type ProductCategory,
} from "@/lib/domain/product";
import { getDb } from "@/lib/db/client";

const FALLBACK_CATEGORY: ProductCategory = "sincategoria";

function database() {
  return getDb();
}

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

function safeOptionalText(value: unknown): string | undefined {
  const clean = safeText(value)?.trim();
  return clean ? clean : undefined;
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function safeOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
}

function safePreviousPrice(
  value: unknown,
  currentPrice: number,
): number | undefined {
  const previousPrice = safeOptionalNumber(value);
  if (previousPrice === undefined || previousPrice <= currentPrice)
    return undefined;
  return previousPrice;
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

function safeObject(
  value: unknown,
): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, val]) => {
      return ["string", "number", "boolean"].includes(typeof val);
    },
  ) as [string, string | number | boolean][];

  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function safeVariants(value: unknown): Product["variants"] {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;

  const source = value as Record<string, unknown>;
  const color = Array.isArray(source.color)
    ? source.color.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : undefined;
  const size = Array.isArray(source.size)
    ? source.size.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : undefined;

  if (!color && !size) return undefined;
  return { color, size };
}

function normalizeProduct(input: ProductInput, existing?: Product): Product {
  const name =
    safeString(input.name) || existing?.name || "Producto sin nombre";
  const categorySource = safeString(input.category);
  const category = isProductCategory(categorySource)
    ? categorySource
    : (existing?.category ?? FALLBACK_CATEGORY);
  const providedSlug = safeString(input.slug);
  const slugCandidate =
    slugify(providedSlug || name) || safeString(existing?.slug);
  const description =
    safeText(input.description) ?? existing?.description ?? "";
  const price = safeNumber(input.price ?? existing?.price);
  const previousPrice = safePreviousPrice(
    input.previousPrice ?? existing?.previousPrice,
    price,
  );
  const subcategory = safeOptionalText(
    input.subcategory ?? existing?.subcategory,
  );
  const brand = safeOptionalText(input.brand ?? existing?.brand);

  return {
    id: safeString(input.id) || existing?.id || randomUUID(),
    slug: slugCandidate || randomUUID(),
    name,
    description,
    price,
    previousPrice,
    images:
      safeImages(input.images).length > 0
        ? safeImages(input.images)
        : (existing?.images ?? []),
    category,
    subcategory,
    brand,
    featured: safeBoolean(input.featured ?? existing?.featured),
    draft: safeBoolean(input.draft ?? existing?.draft),
    variants: safeVariants(input.variants ?? existing?.variants),
    attributes: safeObject(input.attributes ?? existing?.attributes),
  };
}

function mapProductRow(row: {
  product: typeof products.$inferSelect;
  category: typeof categories.$inferSelect | null;
  subcategory: typeof subcategories.$inferSelect | null;
  brand: typeof brands.$inferSelect | null;
}): Product {
  return {
    id: row.product.id,
    slug: row.product.slug,
    name: row.product.name,
    description: row.product.description,
    price: row.product.price,
    previousPrice: row.product.previousPrice ?? undefined,
    images: row.product.images,
    category: (row.category?.slug as ProductCategory) ?? FALLBACK_CATEGORY,
    subcategory: row.subcategory?.name ?? undefined,
    brand: row.brand?.name ?? undefined,
    featured: row.product.featured,
    draft: row.product.draft,
    variants: (row.product.variants as Product["variants"] | null) ?? undefined,
    attributes:
      (row.product.attributes as Product["attributes"] | null) ?? undefined,
  };
}

async function resolveCategoryId(categorySlug: string): Promise<string> {
  const cleanSlug = slugify(categorySlug) || FALLBACK_CATEGORY;
  const existing = await database().query.categories.findFirst({
    where: and(eq(categories.slug, cleanSlug), isNull(categories.deletedAt)),
    columns: { id: true },
  });

  if (existing) return existing.id;

  const [created] = await database()
    .insert(categories)
    .values({ slug: cleanSlug, name: cleanSlug })
    .returning({ id: categories.id });

  return created.id;
}

async function resolveSubcategoryId(
  name: string | undefined,
  categoryId: string,
): Promise<string | null> {
  if (!name) return null;

  const existing = await database().query.subcategories.findFirst({
    where: and(
      eq(subcategories.name, name),
      eq(subcategories.categoryId, categoryId),
      isNull(subcategories.deletedAt),
    ),
    columns: { id: true },
  });

  return existing?.id ?? null;
}

async function resolveBrandId(
  name: string | undefined,
  categoryId: string,
): Promise<string | null> {
  if (!name) return null;

  const existing = await database().query.brands.findFirst({
    where: and(
      eq(brands.name, name),
      eq(brands.categoryId, categoryId),
      isNull(brands.deletedAt),
    ),
    columns: { id: true },
  });

  return existing?.id ?? null;
}

async function getProductById(id: string): Promise<Product | null> {
  const rows = await database()
    .select({
      product: products,
      category: categories,
      subcategory: subcategories,
      brand: brands,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1);

  if (rows.length === 0) return null;
  return mapProductRow(rows[0]);
}

export async function getEditableCatalog(): Promise<{
  path: string;
  products: Product[];
}> {
  const rows = await database()
    .select({
      product: products,
      category: categories,
      subcategory: subcategories,
      brand: brands,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(isNull(products.deletedAt))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));

  return {
    path: "supabase:products",
    products: rows.map(mapProductRow),
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const product = normalizeProduct(input);

  const slugConflict = await database().query.products.findFirst({
    where: and(eq(products.slug, product.slug), isNull(products.deletedAt)),
    columns: { id: true },
  });

  if (slugConflict) throw new SlugConflictError();

  const categoryId = await resolveCategoryId(product.category);
  const subcategoryId = await resolveSubcategoryId(
    product.subcategory,
    categoryId,
  );
  const brandId = await resolveBrandId(product.brand, categoryId);

  const [sort] = await database()
    .select({ maxSort: sql<number>`coalesce(max(${products.sortOrder}), -1)` })
    .from(products)
    .where(isNull(products.deletedAt));

  const [inserted] = await database()
    .insert(products)
    .values({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      previousPrice: product.previousPrice,
      categoryId,
      subcategoryId,
      brandId,
      featured: product.featured,
      draft: product.draft === true,
      images: product.images,
      variants: product.variants,
      attributes: product.attributes,
      sortOrder: (sort?.maxSort ?? -1) + 1,
    })
    .returning({ id: products.id });

  const created = await getProductById(inserted.id);
  if (!created) throw new Error("No se pudo leer el producto creado.");
  return created;
}

export async function updateProduct(
  input: ProductInput,
): Promise<Product | null> {
  const id = safeString(input.id);
  if (!id) return null;

  const current = await getProductById(id);
  if (!current) return null;

  const updated = normalizeProduct({ ...current, ...input }, current);

  const hasSlugCollision = await database().query.products.findFirst({
    where: and(
      eq(products.slug, updated.slug),
      isNull(products.deletedAt),
      sql`${products.id} <> ${id}`,
    ),
    columns: { id: true },
  });

  if (hasSlugCollision) {
    throw new SlugConflictError();
  }

  const categoryId = await resolveCategoryId(updated.category);
  const subcategoryId = await resolveSubcategoryId(
    updated.subcategory,
    categoryId,
  );
  const brandId = await resolveBrandId(updated.brand, categoryId);

  await database()
    .update(products)
    .set({
      slug: updated.slug,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      previousPrice: updated.previousPrice,
      categoryId,
      subcategoryId,
      brandId,
      featured: updated.featured,
      draft: updated.draft === true,
      images: updated.images,
      variants: updated.variants,
      attributes: updated.attributes,
    })
    .where(and(eq(products.id, id), isNull(products.deletedAt)));

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const cleanId = safeString(id);
  if (!cleanId) return false;

  const [deleted] = await database()
    .update(products)
    .set({ deletedAt: new Date() })
    .where(and(eq(products.id, cleanId), isNull(products.deletedAt)))
    .returning({ id: products.id });

  return Boolean(deleted);
}

export async function reorderProducts(
  productIds: string[],
): Promise<Product[]> {
  const cleaned = [
    ...new Set(productIds.map((id) => safeString(id)).filter(Boolean)),
  ];
  if (cleaned.length === 0) {
    const { products: current } = await getEditableCatalog();
    return current;
  }

  await database().transaction(async (tx) => {
    for (let index = 0; index < cleaned.length; index += 1) {
      const id = cleaned[index];
      await tx
        .update(products)
        .set({ sortOrder: index })
        .where(and(eq(products.id, id), isNull(products.deletedAt)));
    }
  });

  const { products: reordered } = await getEditableCatalog();
  const allowed = new Set(cleaned);
  const prioritized = reordered.filter((item) => allowed.has(item.id));
  const rest = reordered.filter((item) => !allowed.has(item.id));

  return [...prioritized, ...rest];
}

export async function getPublicCatalog(): Promise<Product[]> {
  const { products: allProducts } = await getEditableCatalog();
  return allProducts.filter((product) => product.draft !== true);
}

export async function getCategoryIdBySlugForAdmin(
  category: ProductCategory,
): Promise<string> {
  return resolveCategoryId(category);
}
