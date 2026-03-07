import { NextResponse } from "next/server";

import { requireAdminAuth } from "@/lib/server/admin-auth";

import { reorderProducts } from "@/lib/server/catalog-admin";

export async function POST(request: Request) {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as { ids?: string[] };
    if (!Array.isArray(body.ids)) {
      return NextResponse.json(
        { message: "Falta el arreglo de ids." },
        { status: 400 },
      );
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
