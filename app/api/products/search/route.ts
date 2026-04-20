import { NextRequest, NextResponse } from "next/server";

import { type Product } from "@/lib/domain/product";
import { loadCatalog } from "@/lib/server/catalog";

const categorySearchTerms: Record<Product["category"], string[]> = {
  technology: [
    "tecnologia",
    "tecnología",
    "technology",
    "celulares",
    "gadgets",
  ],
  clothing: ["ropa", "clothing", "prendas"],
  bikes: ["bicicletas", "bicicleta", "bikes", "bike"],
  sincategoria: ["sin categoria", "sin categoría", "sincategoria"],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSearchTerms(product: Product) {
  return [
    product.name,
    product.description,
    product.slug,
    product.category,
    ...categorySearchTerms[product.category],
    product.subcategory,
    product.brand,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalize(value));
}

export async function GET(request: NextRequest) {
  const catalog = await loadCatalog();
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(catalog);
  }

  const tokens = normalize(query).split(/\s+/).filter(Boolean);

  const filtered = catalog.filter((product) => {
    const haystack = getSearchTerms(product);

    return tokens.every((token) =>
      haystack.some((value) => value.includes(token)),
    );
  });

  return NextResponse.json(filtered);
}
