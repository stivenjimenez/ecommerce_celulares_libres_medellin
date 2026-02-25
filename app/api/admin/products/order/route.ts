import { NextResponse } from "next/server";

import { reorderProducts } from "@/lib/server/catalog-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    if (!Array.isArray(body.ids)) {
      return NextResponse.json({ message: "Falta el arreglo de ids." }, { status: 400 });
    }

    const products = await reorderProducts(body.ids);
    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { message: "No se pudo guardar el orden de productos." },
      { status: 400 },
    );
  }
}

