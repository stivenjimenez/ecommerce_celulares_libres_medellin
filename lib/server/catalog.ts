import { type Product } from "@/lib/domain/product";
import { getPublicCatalog } from "@/lib/server/catalog-admin";

export async function loadCatalog(): Promise<Product[]> {
  return getPublicCatalog();
}
