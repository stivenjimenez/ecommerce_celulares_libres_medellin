"use client";

import Image from "next/image";
import { Manrope, Sora } from "next/font/google";
import { ShoppingCart, ArrowUpDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { type Product } from "@/lib/domain/product";
import { useProductSearch } from "@/lib/services/product-search";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import styles from "./search.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

const DEBOUNCE_MS = 350;

type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "discount";

const sortLabels: Record<Exclude<SortOption, "default">, string> = {
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
  "name-asc": "Nombre A–Z",
  "name-desc": "Nombre Z–A",
  discount: "Mayor descuento",
};

const sortOptions = Object.keys(sortLabels) as Array<
  Exclude<SortOption, "default">
>;

function applySorting(items: Product[], sort: SortOption): Product[] {
  if (sort === "default") return items;
  const sorted = [...items];

  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "es"));
      break;
    case "discount":
      sorted.sort((a, b) => {
        const da =
          a.previousPrice && a.previousPrice > a.price
            ? a.previousPrice - a.price
            : 0;
        const db =
          b.previousPrice && b.previousPrice > b.price
            ? b.previousPrice - b.price
            : 0;
        return db - da;
      });
      break;
  }

  return sorted;
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
        rootMargin: "0px 0px 180px 0px",
      },
    );

    observer.observe(element);

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

function SearchPageContent() {
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [columns, setColumns] = useState(4);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const { data: products = [], isLoading, error } = useProductSearch(debouncedQuery);

  useEffect(() => {
    setInputValue(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (debouncedQuery) {
      nextParams.set("q", debouncedQuery);
    } else {
      nextParams.delete("q");
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [debouncedQuery, pathname, router, searchParams]);

  useEffect(() => {
    const syncColumns = () =>
      setColumns(getColumnsForViewport(window.innerWidth));
    syncColumns();
    window.addEventListener("resize", syncColumns);
    return () => window.removeEventListener("resize", syncColumns);
  }, []);

  const filteredProducts = useMemo(() => {
    return applySorting(products, sortBy);
  }, [products, sortBy]);

  const resultLabel = debouncedQuery
    ? `${filteredProducts.length} resultado${filteredProducts.length === 1 ? "" : "s"} para “${debouncedQuery}”`
    : `${filteredProducts.length} producto${filteredProducts.length === 1 ? "" : "s"} disponibles`;

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
      product.images[0] ??
      "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";
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
          <div className={styles.cardBottom}>
            <div className={styles.priceStack}>
              <strong>{formatCOP(product.price)}</strong>
              <span
                className={`${styles.previousPrice} ${hasPreviousPrice ? "" : styles.previousPriceEmpty}`}
                aria-hidden={!hasPreviousPrice}
              >
                {hasPreviousPrice
                  ? formatCOP(product.previousPrice!)
                  : "\u00a0"}
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
          <div className={styles.catalogHeading}>
            <h1>SEARCH</h1>
            <p>{resultLabel}</p>
          </div>
          <div className={styles.catalogTopActions}>
            <div className={styles.sortSelect}>
              <ArrowUpDown size={15} className={styles.sortIcon} />
              <select
                value={sortBy === "default" ? "" : sortBy}
                onChange={(e) =>
                  setSortBy((e.target.value as SortOption) || "default")
                }
                aria-label="Ordenar resultados"
              >
                <option value="">Ordenar por</option>
                {sortOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {sortLabels[opt]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Buscar por nombre, descripción o slug..."
            aria-label="Buscar productos"
            autoFocus
          />
        </div>

        {error && (
          <p className={styles.state}>No se pudieron cargar los productos.</p>
        )}
        {isLoading && <p className={styles.state}>Buscando productos...</p>}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <p className={styles.state}>
            No encontramos productos relacionados con tu búsqueda.
          </p>
        )}
        {!error && filteredProducts.length > 0 && (
          <ProductGrid items={filteredProducts} />
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main
          className={`${styles.page} ${sora.variable} ${manrope.variable}`}
        />
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
