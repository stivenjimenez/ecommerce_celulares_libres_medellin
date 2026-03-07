export const productCategories = [
	"technology",
	"clothing",
	"bikes",
	"sincategoria",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export type Subcategory = {
	id: string;
	slug: string;
	name: string;
	category: ProductCategory;
	createdAt: string;
	updatedAt?: string;
};

export type Brand = {
	id: string;
	slug: string;
	name: string;
	category: ProductCategory;
	createdAt: string;
	updatedAt?: string;
};

export const subcategoriesByCategory: Record<string, string[]> = {
	tecnologia: [],
	ropa: [],
	bicicletas: [],
};

export type ProductVariant = {
	color?: string[];
	size?: string[];
};

export type Product = {
	id: string;
	slug: string;
	name: string;
	description: string;
	price: number;
	previousPrice?: number;
	images: string[];
	category: ProductCategory;
	subcategory?: string;
	brand?: string;
	featured: boolean;
	draft?: boolean;
	variants?: ProductVariant;
	attributes?: Record<string, string | number | boolean>;
};
