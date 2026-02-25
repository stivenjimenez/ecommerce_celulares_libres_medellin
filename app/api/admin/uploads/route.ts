import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CloudinarySuccess = {
  secure_url?: string;
  error?: { message?: string };
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "dwqyypb8q";
const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
const unsignedUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? "";
const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "celulares_libres_medellin";

function makeSignature(params: Record<string, string>, secret: string): string {
  const toSign = Object.entries(params)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${toSign}${secret}`)
    .digest("hex");
}

async function uploadToCloudinary(file: File): Promise<string> {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const body = new FormData();
  body.append("file", file);

  if (apiKey && apiSecret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const paramsToSign = { folder: uploadFolder, timestamp };
    const signature = makeSignature(paramsToSign, apiSecret);

    body.append("folder", uploadFolder);
    body.append("timestamp", timestamp);
    body.append("api_key", apiKey);
    body.append("signature", signature);
  } else if (unsignedUploadPreset) {
    body.append("upload_preset", unsignedUploadPreset);
    body.append("folder", uploadFolder);
  } else {
    throw new Error(
      "Falta configurar Cloudinary. Define CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET o CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    body,
  });

  const payload = (await response.json().catch(() => null)) as CloudinarySuccess | null;

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || "Cloudinary no devolvió una URL válida.");
  }

  return payload.secure_url;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const items = formData.getAll("files");
    const files = items.filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ message: "No se recibieron imágenes." }, { status: 400 });
    }

    const urls = await Promise.all(files.map((file) => uploadToCloudinary(file)));
    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron subir las imágenes.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
