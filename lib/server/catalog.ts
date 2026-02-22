import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { type Product } from "@/lib/domain/product";

const GENERATED_PATH = resolve(process.cwd(), "data/products.generated.json");
const DEFAULT_PATH = resolve(process.cwd(), "data/products.json");

async function readCatalogFile(path: string): Promise<Product[] | null> {
  try {
    const content = await readFile(path, "utf8");
    const parsed = JSON.parse(content) as Product[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loadCatalog(): Promise<Product[]> {
  const generated = await readCatalogFile(GENERATED_PATH);
  if (generated && generated.length > 0) {
    return generated;
  }

  const fallback = await readCatalogFile(DEFAULT_PATH);
  return fallback ?? [];
}
