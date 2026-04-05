"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type CSSProperties } from "react";

import { type Product } from "@/lib/domain/product";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import styles from "./product-card.module.css";

const fallbackImage =
  "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";
const MAX_DOTS = 5;
const MOBILE_BREAKPOINT = 760;
const SWIPE_THRESHOLD_PX = 42;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  const images = useMemo(() => {
    return product.images.length > 0 ? product.images : [fallbackImage];
  }, [product.images]);

  const imageCount = images.length;
  const hasMultipleImages = imageCount > 1;
  const hasPreviousPrice =
    typeof product.previousPrice === "number" &&
    product.previousPrice > product.price;
  const cardStyle = { "--reveal-delay": `${delayMs}ms` } as CSSProperties;

  const visibleDots = hasMultipleImages ? Math.min(imageCount, MAX_DOTS) : 0;
  const activeDot =
    visibleDots > 0
      ? Math.min(
          Math.floor(
            (currentIndex / Math.max(imageCount - 1, 1)) * (visibleDots - 1),
          ),
          visibleDots - 1,
        )
      : 0;

  const trackStyle = {
    transform: `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`,
  };

  const goToIndex = (nextIndex: number) => {
    setCurrentIndex(clamp(nextIndex, 0, imageCount - 1));
    setDragOffset(0);
  };

  const isMobileViewport = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultipleImages || !isMobileViewport()) return;

    pointerStartXRef.current = event.clientX;
    pointerIdRef.current = event.pointerId;
    movedRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerStartXRef.current === null) return;

    const deltaX = event.clientX - pointerStartXRef.current;
    if (Math.abs(deltaX) > 4) movedRef.current = true;

    const atFirst = currentIndex === 0 && deltaX > 0;
    const atLast = currentIndex === imageCount - 1 && deltaX < 0;
    setDragOffset(atFirst || atLast ? deltaX * 0.35 : deltaX);
  };

  const resetDrag = () => {
    setDragOffset(0);
    setIsDragging(false);
    pointerStartXRef.current = null;
    pointerIdRef.current = null;
  };

  const finishDrag = () => {
    if (!isDragging) return;

    const deltaX = dragOffset;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      const direction = deltaX < 0 ? 1 : -1;
      goToIndex(currentIndex + direction);
    } else {
      setDragOffset(0);
    }

    setIsDragging(false);
    pointerStartXRef.current = null;
    pointerIdRef.current = null;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    finishDrag();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    resetDrag();
  };

  const openProduct = () => {
    if (!interactive) return;
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }

    router.push(`/productos/${product.slug}`);
  };

  return (
    <article
      className={`${styles.card} ${styles.cardReveal} ${isVisible ? styles.cardVisible : ""}`}
      style={cardStyle}
      role={interactive ? "link" : "article"}
      tabIndex={interactive ? 0 : -1}
      onClick={openProduct}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProduct();
        }
      }}
    >
      <div
        className={styles.imageWrap}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className={`${styles.track} ${isDragging ? styles.trackDragging : ""}`}
          style={trackStyle}
        >
          {images.map((image, index) => (
            <div key={`${product.id}-${index}`} className={styles.slide}>
              <Image
                src={image}
                alt={index === 0 ? product.name : ""}
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
                className={styles.image}
              />
            </div>
          ))}
        </div>

        {hasMultipleImages ? (
          <>
            <div className={styles.imageControls}>
              <button
                type="button"
                className={styles.controlButton}
                aria-label="Imagen anterior"
                disabled={currentIndex === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  goToIndex(currentIndex - 1);
                }}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className={styles.controlButton}
                aria-label="Imagen siguiente"
                disabled={currentIndex === imageCount - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  goToIndex(currentIndex + 1);
                }}
              >
                <ChevronRight />
              </button>
            </div>

            <div className={styles.dots} aria-hidden="true">
              {Array.from({ length: visibleDots }).map((_, index) => (
                <span
                  key={index}
                  className={`${styles.dot} ${index === activeDot ? styles.dotActive : ""}`}
                />
              ))}
            </div>
          </>
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
