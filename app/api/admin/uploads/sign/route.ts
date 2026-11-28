import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireAdminAuth } from "@/lib/server/admin-auth";
import {
  canManageProductImages,
  getProductImageBucket,
} from "@/lib/server/product-image-storage";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;
  if (!canManageProductImages(auth.user.id)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  try {
    const bucket = getProductImageBucket();
    const path = `uploads/${randomUUID()}.webp`;
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error) throw error;

    return NextResponse.json({
      path,
      token: data.token,
      publicUrl: bucket.getPublicUrl(path).data.publicUrl,
    });
  } catch (error) {
    console.error("No se pudo firmar la subida de una imagen.", error);
    return NextResponse.json(
      { message: "No se pudo preparar la subida." },
      { status: 500 },
    );
  }
}
