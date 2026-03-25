import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { requireAdminAuth } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "dwqyypb8q";
const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
const unsignedUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? "";
const uploadFolder =
  process.env.CLOUDINARY_UPLOAD_FOLDER ?? "celulares_libres_medellin";

function makeSignature(params: Record<string, string>, secret: string): string {
  const toSign = Object.entries(params)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export async function GET() {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;

  if (apiKey && apiSecret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = makeSignature(
      { folder: uploadFolder, timestamp },
      apiSecret,
    );

    return NextResponse.json({
      mode: "signed",
      cloudName,
      folder: uploadFolder,
      apiKey,
      timestamp,
      signature,
    });
  }

  if (unsignedUploadPreset) {
    return NextResponse.json({
      mode: "unsigned",
      cloudName,
      folder: uploadFolder,
      uploadPreset: unsignedUploadPreset,
    });
  }

  return NextResponse.json(
    {
      message:
        "Falta configurar Cloudinary. Define CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET o CLOUDINARY_UPLOAD_PRESET.",
    },
    { status: 500 },
  );
}
