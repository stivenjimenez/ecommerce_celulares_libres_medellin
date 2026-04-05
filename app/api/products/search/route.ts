import { NextRequest, NextResponse } from "next/server";

import { type Product } from "@/lib/domain/product";
import { loadCatalog } from "@/lib/server/catalog";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSearchTerms(product: Product) {
  return [product.name, product.description, product.slug]
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
