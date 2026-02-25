"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { type Product } from "@/lib/domain/product";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import styles from "./featured-products-grid.module.css";

const fallbackImage =
  "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function FeaturedProductCard({
  product,
  interactive = true,
}: {
  product: Product;
  interactive?: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const primaryImage = product.images[0] ?? fallbackImage;
  const secondaryImage = product.images[1];
  const hasSecondaryImage = Boolean(secondaryImage);
  const image = hasSecondaryImage && showSecondImage ? secondaryImage : primaryImage;
  const safeSlug = product.slug || product.id;

  function openProductDetail() {
    if (!interactive || !safeSlug) return;
    router.push(`/productos/${safeSlug}`);
  }

  return (
    <article
      className={styles.card}
      role={interactive ? "link" : "article"}
      tabIndex={interactive ? 0 : -1}
      onClick={openProductDetail}
      onKeyDown={(event) => {
        if (interactive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openProductDetail();
        }
      }}
    >
      <div
        className={styles.imageWrap}
        onMouseEnter={() => hasSecondaryImage && setShowSecondImage(true)}
        onMouseLeave={() => setShowSecondImage(false)}
        onPointerDown={() => hasSecondaryImage && setShowSecondImage(true)}
        onPointerUp={() => setShowSecondImage(false)}
        onPointerCancel={() => setShowSecondImage(false)}
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
          className={styles.image}
        />
      </div>

      <div className={styles.cardBody}>
        <h3>{product.name}</h3>
        <p>{truncate(product.description, 64)}</p>

        <div className={styles.cardBottom}>
          <strong>{formatCOP(product.price)}</strong>
          <button
            type="button"
            aria-label={`Agregar ${product.name} al carrito`}
            aria-disabled={!interactive}
            onClick={(event) => {
              event.stopPropagation();
              if (!interactive) return;
              addItem(product);
            }}
          >
            <ShoppingCart />
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  );
}

export function FeaturedProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <FeaturedProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
