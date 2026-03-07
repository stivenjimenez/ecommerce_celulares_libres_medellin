import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("categories_slug_unique_idx").on(table.slug),
    index("categories_deleted_at_idx").on(table.deletedAt),
  ],
);

export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("subcategories_slug_unique_idx").on(table.slug),
    uniqueIndex("subcategories_category_name_unique_idx").on(
      table.categoryId,
      table.name,
    ),
    index("subcategories_category_id_idx").on(table.categoryId),
    index("subcategories_deleted_at_idx").on(table.deletedAt),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("brands_slug_unique_idx").on(table.slug),
    uniqueIndex("brands_category_name_unique_idx").on(
      table.categoryId,
      table.name,
    ),
    index("brands_category_id_idx").on(table.categoryId),
    index("brands_deleted_at_idx").on(table.deletedAt),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: integer("price").notNull().default(0),
    previousPrice: integer("previous_price"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id),
    brandId: uuid("brand_id").references(() => brands.id),
    featured: boolean("featured").notNull().default(false),
    draft: boolean("draft").notNull().default(true),
    images: text("images").array().notNull().default([]),
    variants: jsonb("variants"),
    attributes: jsonb("attributes"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("products_slug_unique_idx").on(table.slug),
    index("products_category_id_idx").on(table.categoryId),
    index("products_subcategory_id_idx").on(table.subcategoryId),
    index("products_brand_id_idx").on(table.brandId),
    index("products_draft_idx").on(table.draft),
    index("products_featured_idx").on(table.featured),
    index("products_sort_order_idx").on(table.sortOrder),
    index("products_deleted_at_idx").on(table.deletedAt),
  ],
);
