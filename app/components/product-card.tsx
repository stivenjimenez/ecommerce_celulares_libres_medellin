"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";

import { type Product } from "@/lib/domain/product";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import styles from "./product-card.module.css";

const fallbackImage =
  "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";

export function ProductCard({
  product,
  delayMs = 0,
  isVisible = true,
  interactive = true,
}: {
  product: Product;
  delayMs?: number;
  isVisible?: boolean;
  interactive?: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const primaryImage = product.images[0] ?? fallbackImage;
  const secondaryImage = product.images[1];
  const hasSecondaryImage = Boolean(secondaryImage);
  const hasPreviousPrice =
    typeof product.previousPrice === "number" &&
    product.previousPrice > product.price;
  const cardStyle = { "--reveal-delay": `${delayMs}ms` } as CSSProperties;

  return (
    <article
      className={`${styles.card} ${styles.cardReveal} ${isVisible ? styles.cardVisible : ""}`}
      style={cardStyle}
      role={interactive ? "link" : "article"}
      tabIndex={interactive ? 0 : -1}
      onClick={() => {
        if (!interactive) return;
        router.push(`/productos/${product.slug}`);
      }}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/productos/${product.slug}`);
        }
      }}
    >
      <div
        className={styles.imageWrap}
        onPointerEnter={(event) => {
          if (hasSecondaryImage && event.pointerType === "mouse") {
            setShowSecondImage(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            setShowSecondImage(false);
          }
        }}
      >
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
          className={`${styles.image} ${styles.imagePrimary} ${
            hasSecondaryImage && showSecondImage ? styles.imageHidden : ""
          }`}
        />
        {hasSecondaryImage && secondaryImage ? (
          <Image
            src={secondaryImage}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
            className={`${styles.image} ${styles.imageSecondary} ${
              showSecondImage ? styles.imageVisible : ""
            }`}
          />
        ) : null}
      </div>

      <div className={styles.cardBody}>
        <h2>{product.name}</h2>
        <div className={styles.cardBottom}>
          <div className={styles.priceStack}>
            <strong>{formatCOP(product.price)}</strong>
            <span
              className={`${styles.previousPrice} ${hasPreviousPrice ? "" : styles.previousPriceEmpty}`}
              aria-hidden={!hasPreviousPrice}
            >
              {hasPreviousPrice ? formatCOP(product.previousPrice!) : "\u00a0"}
            </span>
          </div>
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
