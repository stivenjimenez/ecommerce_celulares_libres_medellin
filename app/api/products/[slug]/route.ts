import { NextResponse } from "next/server";

import { loadCatalog } from "@/lib/server/catalog";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const catalog = await loadCatalog();
  const product = catalog.find((item) => item.slug === slug);

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
