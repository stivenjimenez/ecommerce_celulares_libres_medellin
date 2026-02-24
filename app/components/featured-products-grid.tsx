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

function FeaturedCard({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const primaryImage = product.images[0] ?? fallbackImage;
  const secondaryImage = product.images[1];
  const hasSecondaryImage = Boolean(secondaryImage);
  const image = hasSecondaryImage && showSecondImage ? secondaryImage : primaryImage;

  return (
    <article
      className={styles.card}
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/productos/${product.slug}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/productos/${product.slug}`);
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
            onClick={(event) => {
              event.stopPropagation();
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
        <FeaturedCard key={product.id} product={product} />
      ))}
    </div>
  );
}
