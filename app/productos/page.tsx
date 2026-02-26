"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { ShoppingCart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { type Product, type ProductCategory } from "@/lib/domain/product";
import { useProducts } from "@/lib/services/products";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import styles from "./productos.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const categoryFilters: Record<string, ProductCategory[]> = {
  tecnologia: ["technology"],
  ropa: ["clothing", "shoes"],
  bicicletas: ["bikes"],
};

const categoryTitles: Record<string, string> = {
  tecnologia: "Tecnología",
  ropa: "Ropa",
  bicicletas: "Bicicletas",
};

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function useRevealOnView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(timer);
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        // More permissive: reveal a bit before entering viewport to avoid hidden rows.
        rootMargin: "0px 0px 180px 0px",
      },
    );

    observer.observe(element);

    // Failsafe: never keep cards hidden if observer doesn't fire (embedded/webview quirks).
    const fallbackTimer = window.setTimeout(() => {
      setIsVisible(true);
      observer.disconnect();
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [isVisible]);

  return { ref, isVisible };
}

function getColumnsForViewport(width: number) {
  if (width <= 390) return 1;
  if (width <= 760) return 2;
  if (width <= 1100) return 3;
  return 4;
}

function getRevealDelay(index: number, columns: number) {
  const row = Math.floor(index / columns);
  const col = index % columns;
  return row * 90 + col * 42;
}

function ProductosPageContent() {
  const { data: products = [], isLoading, error } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [columns, setColumns] = useState(4);
  const categoryParam = searchParams.get("categoria")?.toLowerCase() ?? "";
  const activeCategories = categoryFilters[categoryParam] ?? null;
  const sectionTitle = categoryTitles[categoryParam] ?? "Catálogo completo";

  useEffect(() => {
    const syncColumns = () => setColumns(getColumnsForViewport(window.innerWidth));
    syncColumns();
    window.addEventListener("resize", syncColumns);
    return () => window.removeEventListener("resize", syncColumns);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !activeCategories || activeCategories.includes(product.category);
      return matchesCategory;
    });
  }, [activeCategories, products]);

  const groupedSections = useMemo(() => {
    if (activeCategories) return [];

    const keys = ["tecnologia", "ropa", "bicicletas"] as const;
    return keys
      .map((key) => ({
        key,
        title: categoryTitles[key],
        products: filteredProducts.filter((product) => categoryFilters[key].includes(product.category)),
      }))
      .filter((section) => section.products.length > 0);
  }, [activeCategories, filteredProducts]);

  function ProductCard({
    product,
    delayMs,
    isVisible,
  }: {
    product: Product;
    delayMs: number;
    isVisible: boolean;
  }) {
    const [showSecondImage, setShowSecondImage] = useState(false);
    const primaryImage =
      product.images[0] ?? "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";
    const secondaryImage = product.images[1];
    const hasSecondaryImage = Boolean(secondaryImage);
    const hasPreviousPrice =
      typeof product.previousPrice === "number" && product.previousPrice > product.price;
    const cardStyle = { "--reveal-delay": `${delayMs}ms` } as CSSProperties;

    return (
      <article
        className={`${styles.card} ${styles.cardReveal} ${isVisible ? styles.cardVisible : ""}`}
        style={cardStyle}
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
          <p>{truncate(product.description, 64)}</p>
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

  function ProductGrid({ items }: { items: Product[] }) {
    const { ref, isVisible } = useRevealOnView<HTMLDivElement>();

    return (
      <div ref={ref} className={styles.grid}>
        {items.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            delayMs={getRevealDelay(index, columns)}
            isVisible={isVisible}
          />
        ))}
      </div>
    );
  }

  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <section className={styles.catalog}>
        <div className={styles.catalogTop}>
          <h1>{sectionTitle.toUpperCase()}</h1>
        </div>

        {error && <p className={styles.state}>No se pudieron cargar los productos.</p>}
        {isLoading && <p className={styles.state}>Cargando catálogo...</p>}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <p className={styles.state}>No hay productos disponibles en esta categoría.</p>
        )}

        {!error && filteredProducts.length > 0 && activeCategories && (
          <ProductGrid items={filteredProducts} />
        )}

        {!error && filteredProducts.length > 0 && !activeCategories && (
          <div className={styles.categorySections}>
            {groupedSections.map((section) => (
              <div key={section.key} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>{section.title}</h2>
                <ProductGrid items={section.products} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={<main className={`${styles.page} ${sora.variable} ${manrope.variable}`} />}>
      <ProductosPageContent />
    </Suspense>
  );
}
