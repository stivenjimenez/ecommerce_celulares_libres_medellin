import Image, { type ImageProps } from "next/image";

const catalogStoragePrefix =
  "https://nkserepaqmnxuydbhvev.supabase.co/storage/v1/object/public/product-images/";

export function CatalogImage({ src, unoptimized, ...props }: ImageProps) {
  const isStorageImage =
    typeof src === "string" && src.startsWith(catalogStoragePrefix);

  return (
    <Image {...props} src={src} unoptimized={unoptimized || isStorageImage} />
  );
}
