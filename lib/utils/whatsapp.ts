import { getPublicProductUrl } from "@/lib/site-metadata";

export function productAvailabilityUrl(productName: string, slug: string) {
  const productUrl = getPublicProductUrl(slug);
  const message = `Hola, me interesa este producto: ${productName}. ¿Me podrían confirmar si aún está disponible?\n\n${productUrl}`;
  return `https://wa.me/573004569938?text=${encodeURIComponent(message)}`;
}
