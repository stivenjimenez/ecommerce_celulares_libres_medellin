import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
	productCategories,
	type ProductCategory,
	type Subcategory,
} from "@/lib/domain/product";

const GENERATED_PATH = resolve(
	process.cwd(),
	"data/subcategories.generated.json",
);
const DEFAULT_PATH = resolve(process.cwd(), "data/subcategories.json");

type SubcategoryInput = Partial<Subcategory>;

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
	const createdAt = safeString(input.createdAt) || existing?.createdAt || now;
	const updatedAt = safeString(input.updatedAt) || now;

	return {
		id: safeString(input.id) || existing?.id || randomUUID(),
		slug,
		name,
		category,
		createdAt,
		updatedAt,
	};
}

async function readSubcategoriesFile(
	path: string,
): Promise<Subcategory[] | null> {
	try {
		const content = await readFile(path, "utf8");
		const parsed = JSON.parse(content) as unknown;
		if (!Array.isArray(parsed)) return null;
		return parsed.map((item) => normalizeSubcategory(item as SubcategoryInput));
	} catch {
		return null;
	}
}

async function getSubcategoriesTargetPath(): Promise<string> {
	const generated = await readSubcategoriesFile(GENERATED_PATH);
	if (generated) return GENERATED_PATH;

	const fallback = await readSubcategoriesFile(DEFAULT_PATH);
	if (fallback) return DEFAULT_PATH;

	return GENERATED_PATH;
}

async function persist(
	path: string,
	subcategories: Subcategory[],
): Promise<void> {
	await writeFile(path, `${JSON.stringify(subcategories, null, 2)}\n`, "utf8");
}

export async function getEditableSubcategories(): Promise<{
	path: string;
	subcategories: Subcategory[];
}> {
	const path = await getSubcategoriesTargetPath();
	const subcategories = (await readSubcategoriesFile(path)) ?? [];
	return { path, subcategories };
}

export async function createSubcategory(
	input: SubcategoryInput,
): Promise<Subcategory> {
	const { path, subcategories } = await getEditableSubcategories();
	const subcategory = normalizeSubcategory(input);

	if (subcategories.some((item) => item.id === subcategory.id)) {
		subcategory.id = randomUUID();
	}

	const next = [subcategory, ...subcategories];
	await persist(path, next);
	return subcategory;
}

export async function updateSubcategory(
	input: SubcategoryInput,
): Promise<Subcategory | null> {
	const id = safeString(input.id);
	if (!id) return null;

	const { path, subcategories } = await getEditableSubcategories();
	const index = subcategories.findIndex((item) => item.id === id);
	if (index < 0) return null;

	const current = subcategories[index];
	const updated = normalizeSubcategory({ ...current, ...input }, current);
	const next = [...subcategories];
	next[index] = updated;
	await persist(path, next);
	return updated;
}

export async function deleteSubcategory(id: string): Promise<boolean> {
	const cleanId = safeString(id);
	if (!cleanId) return false;

	const { path, subcategories } = await getEditableSubcategories();
	const next = subcategories.filter((item) => item.id !== cleanId);
	if (next.length === subcategories.length) return false;

	await persist(path, next);
	return true;
}
