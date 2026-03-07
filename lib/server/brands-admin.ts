import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { productCategories, type Brand, type ProductCategory } from "@/lib/domain/product";

const GENERATED_PATH = resolve(process.cwd(), "data/brands.generated.json");
const DEFAULT_PATH = resolve(process.cwd(), "data/brands.json");

type BrandInput = Partial<Brand>;

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

function normalizeBrand(input: BrandInput, existing?: Brand): Brand {
	const name = safeString(input.name) || existing?.name || "Marca";
	const slug = slugify(safeString(input.slug) || name) || existing?.slug || randomUUID();
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

async function readBrandsFile(path: string): Promise<Brand[] | null> {
	try {
		const content = await readFile(path, "utf8");
		const parsed = JSON.parse(content) as unknown;
		if (!Array.isArray(parsed)) return null;
		return parsed.map((item) => normalizeBrand(item as BrandInput));
	} catch {
		return null;
	}
}

async function getBrandsTargetPath(): Promise<string> {
	const generated = await readBrandsFile(GENERATED_PATH);
	if (generated) return GENERATED_PATH;

	const fallback = await readBrandsFile(DEFAULT_PATH);
	if (fallback) return DEFAULT_PATH;

	return GENERATED_PATH;
}

async function persist(path: string, brands: Brand[]): Promise<void> {
	await writeFile(path, `${JSON.stringify(brands, null, 2)}\n`, "utf8");
}

export async function getEditableBrands(): Promise<{ path: string; brands: Brand[] }> {
	const path = await getBrandsTargetPath();
	const brands = (await readBrandsFile(path)) ?? [];
	return { path, brands };
}

export async function createBrand(input: BrandInput): Promise<Brand> {
	const { path, brands } = await getEditableBrands();
	const brand = normalizeBrand(input);

	if (brands.some((item) => item.id === brand.id)) {
		brand.id = randomUUID();
	}

	const next = [brand, ...brands];
	await persist(path, next);
	return brand;
}

export async function updateBrand(input: BrandInput): Promise<Brand | null> {
	const id = safeString(input.id);
	if (!id) return null;

	const { path, brands } = await getEditableBrands();
	const index = brands.findIndex((item) => item.id === id);
	if (index < 0) return null;

	const current = brands[index];
	const updated = normalizeBrand({ ...current, ...input }, current);
	const next = [...brands];
	next[index] = updated;
	await persist(path, next);
	return updated;
}

export async function deleteBrand(id: string): Promise<boolean> {
	const cleanId = safeString(id);
	if (!cleanId) return false;

	const { path, brands } = await getEditableBrands();
	const next = brands.filter((item) => item.id !== cleanId);
	if (next.length === brands.length) return false;

	await persist(path, next);
	return true;
}
