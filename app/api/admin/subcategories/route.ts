import { NextResponse } from "next/server";

import {
	createSubcategory,
	deleteSubcategory,
	getEditableSubcategories,
	updateSubcategory,
} from "@/lib/server/subcategories-admin";

export async function GET() {
	const { subcategories } = await getEditableSubcategories();
	return NextResponse.json(subcategories);
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const subcategory = await createSubcategory(body);
		return NextResponse.json(subcategory, { status: 201 });
	} catch {
		return NextResponse.json(
			{ message: "No se pudo crear la subcategoría." },
			{ status: 400 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const subcategory = await updateSubcategory(body);

		if (!subcategory) {
			return NextResponse.json(
				{ message: "Subcategoría no encontrada." },
				{ status: 404 },
			);
		}

		return NextResponse.json(subcategory);
	} catch {
		return NextResponse.json(
			{ message: "No se pudo actualizar la subcategoría." },
			{ status: 400 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const body = (await request.json()) as { id?: string };
		if (!body.id) {
			return NextResponse.json({ message: "Falta el id." }, { status: 400 });
		}

		const deleted = await deleteSubcategory(body.id);
		if (!deleted) {
			return NextResponse.json(
				{ message: "Subcategoría no encontrada." },
				{ status: 404 },
			);
		}

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json(
			{ message: "No se pudo eliminar la subcategoría." },
			{ status: 400 },
		);
	}
}
