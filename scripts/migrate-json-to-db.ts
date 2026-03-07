import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import { count, isNull } from "drizzle-orm";

import { brands, categories, products, subcategories } from "../db/schema";
import { productCategories, type Product } from "../lib/domain/product";
import { getDb } from "../lib/db/client";

config({ path: ".env.local" });

type JsonSubcategory = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

type JsonBrand = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function categoryLabel(slug: string): string {
  if (slug === "technology") return "Tecnología";
  if (slug === "clothing") return "Ropa";
  if (slug === "bikes") return "Bicicletas";
  if (slug === "sincategoria") return "Sin categoría";
  return slug;
}

async function readJson<T>(path: string): Promise<T> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content) as T;
}

async function main() {
  const db = getDb();
  const productsPath = resolve(process.cwd(), "data/products.generated.json");
  const subcategoriesPath = resolve(
    process.cwd(),
    "data/subcategories.generated.json",
  );
  const brandsPath = resolve(process.cwd(), "data/brands.generated.json");

  const productsJson = await readJson<Product[]>(productsPath);
  const subcategoriesJson =
    await readJson<JsonSubcategory[]>(subcategoriesPath);
  const brandsJson = await readJson<JsonBrand[]>(brandsPath);

  const categorySet = new Set<string>(productCategories);
  for (const item of productsJson) categorySet.add(item.category);
  for (const item of subcategoriesJson) categorySet.add(item.category);
  for (const item of brandsJson) categorySet.add(item.category);

  for (const categorySlug of categorySet) {
    const normalized = slugify(categorySlug) || "sincategoria";
    await db
      .insert(categories)
      .values({
        slug: normalized,
        name: categoryLabel(normalized),
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: categoryLabel(normalized),
          deletedAt: null,
        },
      });
  }

  const categoryRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(isNull(categories.deletedAt));
  const categoryIdBySlug = new Map(
    categoryRows.map((row) => [row.slug, row.id]),
  );

  for (const item of subcategoriesJson) {
    const categorySlug = slugify(item.category) || "sincategoria";
    const categoryId =
      categoryIdBySlug.get(categorySlug) ??
      categoryIdBySlug.get("sincategoria");
    if (!categoryId) continue;

    await db
      .insert(subcategories)
      .values({
        id: item.id,
        slug: slugify(item.slug || item.name),
        name: item.name,
        categoryId,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: subcategories.slug,
        set: {
          name: item.name,
          categoryId,
          deletedAt: null,
        },
      });
  }

  for (const item of brandsJson) {
    const categorySlug = slugify(item.category) || "sincategoria";
    const categoryId =
      categoryIdBySlug.get(categorySlug) ??
      categoryIdBySlug.get("sincategoria");
    if (!categoryId) continue;

    await db
      .insert(brands)
      .values({
        id: item.id,
        slug: slugify(item.slug || item.name),
        name: item.name,
        categoryId,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: brands.slug,
        set: {
          name: item.name,
          categoryId,
          deletedAt: null,
        },
      });
  }

  const allSubcategories = await db
    .select({
      id: subcategories.id,
      name: subcategories.name,
      categoryId: subcategories.categoryId,
    })
    .from(subcategories)
    .where(isNull(subcategories.deletedAt));

  const allBrands = await db
    .select({ id: brands.id, name: brands.name, categoryId: brands.categoryId })
    .from(brands)
    .where(isNull(brands.deletedAt));

  const subcategoryIdByKey = new Map(
    allSubcategories.map((item) => [
      `${item.categoryId}::${item.name}`,
      item.id,
    ]),
  );
  const brandIdByKey = new Map(
    allBrands.map((item) => [`${item.categoryId}::${item.name}`, item.id]),
  );

  for (const [index, item] of productsJson.entries()) {
    const categorySlug = slugify(item.category) || "sincategoria";
    const categoryId =
      categoryIdBySlug.get(categorySlug) ??
      categoryIdBySlug.get("sincategoria");
    if (!categoryId) continue;

    const subcategoryId = item.subcategory
      ? (subcategoryIdByKey.get(`${categoryId}::${item.subcategory}`) ?? null)
      : null;
    const brandId = item.brand
      ? (brandIdByKey.get(`${categoryId}::${item.brand}`) ?? null)
      : null;

    await db
      .insert(products)
      .values({
        id: item.id,
        slug: slugify(item.slug || item.name),
        name: item.name,
        description: item.description ?? "",
        price: Number(item.price) || 0,
        previousPrice: item.previousPrice ?? null,
        categoryId,
        subcategoryId,
        brandId,
        featured: item.featured === true,
        draft: item.draft === true,
        images: Array.isArray(item.images) ? item.images : [],
        variants: item.variants ?? null,
        attributes: item.attributes ?? null,
        sortOrder: index,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: item.name,
          description: item.description ?? "",
          price: Number(item.price) || 0,
          previousPrice: item.previousPrice ?? null,
          categoryId,
          subcategoryId,
          brandId,
          featured: item.featured === true,
          draft: item.draft === true,
          images: Array.isArray(item.images) ? item.images : [],
          variants: item.variants ?? null,
          attributes: item.attributes ?? null,
          sortOrder: index,
          deletedAt: null,
        },
      });
  }

  const [categoriesCount] = await db
    .select({ value: count() })
    .from(categories)
    .where(isNull(categories.deletedAt));
  const [subcategoriesCount] = await db
    .select({ value: count() })
    .from(subcategories)
    .where(isNull(subcategories.deletedAt));
  const [brandsCount] = await db
    .select({ value: count() })
    .from(brands)
    .where(isNull(brands.deletedAt));
  const [productsCount] = await db
    .select({ value: count() })
    .from(products)
    .where(isNull(products.deletedAt));

  console.log("Migration finished", {
    categories: categoriesCount?.value ?? 0,
    subcategories: subcategoriesCount?.value ?? 0,
    brands: brandsCount?.value ?? 0,
    products: productsCount?.value ?? 0,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
