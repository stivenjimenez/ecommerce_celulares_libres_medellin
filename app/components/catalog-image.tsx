import Image, { type ImageProps } from "next/image";

import { PRODUCT_IMAGE_FALLBACK } from "@/lib/domain/product-images";

const catalogStoragePrefix =
  "https://nkserepaqmnxuydbhvev.supabase.co/storage/v1/object/public/product-images/";

export function CatalogImage({ src, unoptimized, ...props }: ImageProps) {
  const servesDirectly =
    typeof src === "string" &&
    (src === PRODUCT_IMAGE_FALLBACK || src.startsWith(catalogStoragePrefix));

  return (
    <Image {...props} src={src} unoptimized={unoptimized || servesDirectly} />
  );
}
