import { NextResponse } from "next/server";

import {
  createBrand,
  deleteBrand,
  getEditableBrands,
  updateBrand,
} from "@/lib/server/brands-admin";
import { requireAdminAuth } from "@/lib/server/admin-auth";

export async function GET() {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;

  const { brands } = await getEditableBrands();
  return NextResponse.json(brands);
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brand = await createBrand(body);
    return NextResponse.json(brand, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "No se pudo crear la marca." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brand = await updateBrand(body);

    if (!brand) {
      return NextResponse.json(
        { message: "Marca no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(brand);
  } catch {
    return NextResponse.json(
      { message: "No se pudo actualizar la marca." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ message: "Falta el id." }, { status: 400 });
    }

    const deleted = await deleteBrand(body.id);
    if (!deleted) {
      return NextResponse.json(
        { message: "Marca no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "No se pudo eliminar la marca." },
      { status: 400 },
    );
  }
}
