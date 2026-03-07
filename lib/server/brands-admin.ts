import { randomUUID } from "node:crypto";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { brands, categories } from "@/db/schema";
import {
  productCategories,
  type Brand,
  type ProductCategory,
} from "@/lib/domain/product";
import { getDb } from "@/lib/db/client";
import { getCategoryIdBySlugForAdmin } from "@/lib/server/catalog-admin";

type BrandInput = Partial<Brand>;

function database() {
  return getDb();
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

function isProductCategory(value: string): value is ProductCategory {
  return (productCategories as readonly string[]).includes(value);
}

function mapRow(row: {
  brand: typeof brands.$inferSelect;
  category: typeof categories.$inferSelect | null;
}): Brand {
  return {
    id: row.brand.id,
    slug: row.brand.slug,
    name: row.brand.name,
    category: (row.category?.slug as ProductCategory) ?? "sincategoria",
    createdAt: row.brand.createdAt.toISOString(),
    updatedAt: row.brand.updatedAt.toISOString(),
  };
}

async function getBrandById(id: string): Promise<Brand | null> {
  const rows = await database()
    .select({ brand: brands, category: categories })
    .from(brands)
    .leftJoin(categories, eq(brands.categoryId, categories.id))
    .where(and(eq(brands.id, id), isNull(brands.deletedAt)))
    .limit(1);

  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

function normalizeBrand(input: BrandInput, existing?: Brand): Brand {
  const name = safeString(input.name) || existing?.name || "Marca";
  const slug =
    slugify(safeString(input.slug) || name) || existing?.slug || randomUUID();
  const categoryCandidate = safeString(input.category);
  const category = isProductCategory(categoryCandidate)
    ? categoryCandidate
    : (existing?.category ?? "sincategoria");
  const now = new Date().toISOString();

  return {
    id: safeString(input.id) || existing?.id || randomUUID(),
    slug,
    name,
    category,
    createdAt: safeString(input.createdAt) || existing?.createdAt || now,
    updatedAt: now,
  };
}

export async function getEditableBrands(): Promise<{
  path: string;
  brands: Brand[];
}> {
  const rows = await database()
    .select({ brand: brands, category: categories })
    .from(brands)
    .leftJoin(categories, eq(brands.categoryId, categories.id))
    .where(isNull(brands.deletedAt))
    .orderBy(asc(brands.createdAt));

  return {
    path: "supabase:brands",
    brands: rows.map(mapRow),
  };
}

export async function createBrand(input: BrandInput): Promise<Brand> {
  const brand = normalizeBrand(input);
  const categoryId = await getCategoryIdBySlugForAdmin(brand.category);

  const [slugConflict] = await database()
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.slug, brand.slug), isNull(brands.deletedAt)))
    .limit(1);

  if (slugConflict) {
    throw new Error("Ya existe una marca con ese slug.");
  }

  const [nameConflict] = await database()
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.name, brand.name),
        eq(brands.categoryId, categoryId),
        isNull(brands.deletedAt),
      ),
    )
    .limit(1);

  if (nameConflict) {
    throw new Error("Ya existe una marca con ese nombre en la categoría.");
  }

  const [inserted] = await database()
    .insert(brands)
    .values({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      categoryId,
    })
    .returning({ id: brands.id });

  const created = await getBrandById(inserted.id);
  if (!created) throw new Error("No se pudo leer la marca creada.");
  return created;
}

export async function updateBrand(input: BrandInput): Promise<Brand | null> {
  const id = safeString(input.id);
  if (!id) return null;

  const current = await getBrandById(id);
  if (!current) return null;

  const updated = normalizeBrand({ ...current, ...input }, current);
  const categoryId = await getCategoryIdBySlugForAdmin(updated.category);

  const [slugConflict] = await database()
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.slug, updated.slug),
        isNull(brands.deletedAt),
        sql`${brands.id} <> ${id}`,
      ),
    )
    .limit(1);

  if (slugConflict) {
    throw new Error("Ya existe una marca con ese slug.");
  }

  const [nameConflict] = await database()
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.name, updated.name),
        eq(brands.categoryId, categoryId),
        isNull(brands.deletedAt),
        sql`${brands.id} <> ${id}`,
      ),
    )
    .limit(1);

  if (nameConflict) {
    throw new Error("Ya existe una marca con ese nombre en la categoría.");
  }

  await database()
    .update(brands)
    .set({
      slug: updated.slug,
      name: updated.name,
      categoryId,
    })
    .where(and(eq(brands.id, id), isNull(brands.deletedAt)));

  return getBrandById(id);
}

export async function deleteBrand(id: string): Promise<boolean> {
  const cleanId = safeString(id);
  if (!cleanId) return false;

  const [deleted] = await database()
    .update(brands)
    .set({ deletedAt: new Date() })
    .where(and(eq(brands.id, cleanId), isNull(brands.deletedAt)))
    .returning({ id: brands.id });

  return Boolean(deleted);
}
