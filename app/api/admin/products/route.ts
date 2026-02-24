import { NextResponse } from "next/server";

import {
  createProduct,
  deleteProduct,
  getEditableCatalog,
  SlugConflictError,
  updateProduct,
} from "@/lib/server/catalog-admin";

export async function GET() {
  const { products } = await getEditableCatalog();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof SlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return NextResponse.json({ message: "No se pudo crear el producto." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const product = await updateProduct(body);

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof SlugConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return NextResponse.json({ message: "No se pudo actualizar el producto." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json({ message: "Falta el id." }, { status: 400 });
    }

    const deleted = await deleteProduct(body.id);

    if (!deleted) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "No se pudo eliminar el producto." }, { status: 400 });
  }
}
