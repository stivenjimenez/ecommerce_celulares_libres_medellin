export const productCategories = ["technology", "clothing", "shoes", "bikes", "sincategoria"] as const;

export type ProductCategory = (typeof productCategories)[number];

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
  featured: boolean;
  draft?: boolean;
  variants?: ProductVariant;
  attributes?: Record<string, string | number | boolean>;
};
