import { randomUUID } from "node:crypto";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { categories, subcategories } from "@/db/schema";
import {
  productCategories,
  type ProductCategory,
  type Subcategory,
} from "@/lib/domain/product";
import { getDb } from "@/lib/db/client";
import { getCategoryIdBySlugForAdmin } from "@/lib/server/catalog-admin";

type SubcategoryInput = Partial<Subcategory>;

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
  subcategory: typeof subcategories.$inferSelect;
  category: typeof categories.$inferSelect | null;
}): Subcategory {
  return {
    id: row.subcategory.id,
    slug: row.subcategory.slug,
    name: row.subcategory.name,
    category: (row.category?.slug as ProductCategory) ?? "sincategoria",
    createdAt: row.subcategory.createdAt.toISOString(),
    updatedAt: row.subcategory.updatedAt.toISOString(),
  };
}

async function getSubcategoryById(id: string): Promise<Subcategory | null> {
  const rows = await database()
    .select({ subcategory: subcategories, category: categories })
    .from(subcategories)
    .leftJoin(categories, eq(subcategories.categoryId, categories.id))
    .where(and(eq(subcategories.id, id), isNull(subcategories.deletedAt)))
    .limit(1);

  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

function normalizeSubcategory(
  input: SubcategoryInput,
  existing?: Subcategory,
): Subcategory {
  const name = safeString(input.name) || existing?.name || "Subcategoría";
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

export async function getEditableSubcategories(): Promise<{
  path: string;
  subcategories: Subcategory[];
}> {
  const rows = await database()
    .select({ subcategory: subcategories, category: categories })
    .from(subcategories)
    .leftJoin(categories, eq(subcategories.categoryId, categories.id))
    .where(isNull(subcategories.deletedAt))
    .orderBy(asc(subcategories.createdAt));

  return {
    path: "supabase:subcategories",
    subcategories: rows.map(mapRow),
  };
}

export async function createSubcategory(
  input: SubcategoryInput,
): Promise<Subcategory> {
  const subcategory = normalizeSubcategory(input);
  const categoryId = await getCategoryIdBySlugForAdmin(subcategory.category);

  const [slugConflict] = await database()
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(
      and(
        eq(subcategories.slug, subcategory.slug),
        isNull(subcategories.deletedAt),
      ),
    )
    .limit(1);

  if (slugConflict) {
    throw new Error("Ya existe una subcategoría con ese slug.");
  }

  const [nameConflict] = await database()
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(
      and(
        eq(subcategories.name, subcategory.name),
        eq(subcategories.categoryId, categoryId),
        isNull(subcategories.deletedAt),
      ),
    )
    .limit(1);

  if (nameConflict) {
    throw new Error(
      "Ya existe una subcategoría con ese nombre en la categoría.",
    );
  }

  const [inserted] = await database()
    .insert(subcategories)
    .values({
      id: subcategory.id,
      slug: subcategory.slug,
      name: subcategory.name,
      categoryId,
    })
    .returning({ id: subcategories.id });

  const created = await getSubcategoryById(inserted.id);
  if (!created) throw new Error("No se pudo leer la subcategoría creada.");
  return created;
}

export async function updateSubcategory(
  input: SubcategoryInput,
): Promise<Subcategory | null> {
  const id = safeString(input.id);
  if (!id) return null;

  const current = await getSubcategoryById(id);
  if (!current) return null;

  const updated = normalizeSubcategory({ ...current, ...input }, current);
  const categoryId = await getCategoryIdBySlugForAdmin(updated.category);

  const [slugConflict] = await database()
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(
      and(
        eq(subcategories.slug, updated.slug),
        isNull(subcategories.deletedAt),
        sql`${subcategories.id} <> ${id}`,
      ),
    )
    .limit(1);

  if (slugConflict) {
    throw new Error("Ya existe una subcategoría con ese slug.");
  }

  const [nameConflict] = await database()
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(
      and(
        eq(subcategories.name, updated.name),
        eq(subcategories.categoryId, categoryId),
        isNull(subcategories.deletedAt),
        sql`${subcategories.id} <> ${id}`,
      ),
    )
    .limit(1);

  if (nameConflict) {
    throw new Error(
      "Ya existe una subcategoría con ese nombre en la categoría.",
    );
  }

  await database()
    .update(subcategories)
    .set({
      slug: updated.slug,
      name: updated.name,
      categoryId,
    })
    .where(and(eq(subcategories.id, id), isNull(subcategories.deletedAt)));

  return getSubcategoryById(id);
}

export async function deleteSubcategory(id: string): Promise<boolean> {
  const cleanId = safeString(id);
  if (!cleanId) return false;

  const [deleted] = await database()
    .update(subcategories)
    .set({ deletedAt: new Date() })
    .where(and(eq(subcategories.id, cleanId), isNull(subcategories.deletedAt)))
    .returning({ id: subcategories.id });

  return Boolean(deleted);
}
