import { NextResponse } from "next/server";

import { loadCatalog } from "@/lib/server/catalog";

export async function GET() {
  const catalog = await loadCatalog();
  return NextResponse.json(catalog);
}
