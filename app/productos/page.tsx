"use client";

import Image from "next/image";
import { Manrope, Sora } from "next/font/google";
import { ShoppingCart, ArrowUpDown } from "lucide-react";
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
  ropa: ["clothing"],
  bicicletas: ["bikes"],
};

const categoryTitles: Record<string, string> = {
  tecnologia: "Tecnología",
  ropa: "Ropa",
  bicicletas: "Bicicletas",
};

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "discount";

const sortLabels: Record<Exclude<SortOption, "default">, string> = {
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
  "name-asc": "Nombre A–Z",
  "name-desc": "Nombre Z–A",
  discount: "Mayor descuento",
};

const sortOptions = Object.keys(sortLabels) as Array<Exclude<SortOption, "default">>;

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
        const da = a.previousPrice && a.previousPrice > a.price ? a.previousPrice - a.price : 0;
        const db = b.previousPrice && b.previousPrice > b.price ? b.previousPrice - b.price : 0;
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

function ProductosPageContent() {
  const { data: products = [], isLoading, error } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [columns, setColumns] = useState(4);
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const categoryParam = searchParams.get("categoria")?.toLowerCase() ?? "";
  const activeCategories = categoryFilters[categoryParam] ?? null;
  const sectionTitle = categoryTitles[categoryParam] ?? "Catálogo completo";

  useEffect(() => {
    const syncColumns = () => setColumns(getColumnsForViewport(window.innerWidth));
    syncColumns();
    window.addEventListener("resize", syncColumns);
    return () => window.removeEventListener("resize", syncColumns);
  }, []);

  useEffect(() => {
    setActiveSubcategory("");
    setSortBy("default");
  }, [categoryParam]);

  const categoryProducts = useMemo(() => {
    return products.filter((product) => {
      return !activeCategories || activeCategories.includes(product.category);
    });
  }, [activeCategories, products]);

  const visibleSubcategories = useMemo(() => {
    if (!activeCategories) return [];
    const items = new Set(
      categoryProducts
        .map((product) => product.subcategory?.trim())
        .filter((subcategory): subcategory is string => Boolean(subcategory)),
    );
    return [...items].sort((a, b) => a.localeCompare(b, "es"));
  }, [activeCategories, categoryProducts]);

  const filteredProducts = useMemo(() => {
    const subFiltered = activeSubcategory
      ? categoryProducts.filter((product) => product.subcategory === activeSubcategory)
      : categoryProducts;

    return applySorting(subFiltered, sortBy);
  }, [categoryProducts, activeSubcategory, sortBy]);

  const groupedSections = useMemo(() => {
    if (activeCategories || sortBy !== "default") return [];

    const keys = ["tecnologia", "ropa", "bicicletas"] as const;
    return keys
      .map((key) => ({
        key,
        title: categoryTitles[key],
        products: filteredProducts.filter((product) => categoryFilters[key].includes(product.category)),
      }))
      .filter((section) => section.products.length > 0);
  }, [activeCategories, filteredProducts, sortBy]);

  const showFlatList = activeCategories !== null || sortBy !== "default";

  function ProductCard({ product, delayMs, isVisible }: { product: Product; delayMs: number; isVisible: boolean }) {
    const [showSecondImage, setShowSecondImage] = useState(false);
    const primaryImage =
      product.images[0] ??
      "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";
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
          <div className={styles.catalogTopActions}>
            <div className={styles.sortSelect}>
              <ArrowUpDown size={15} className={styles.sortIcon} />
              <select
                value={sortBy === "default" ? "" : sortBy}
                onChange={(e) => setSortBy((e.target.value as SortOption) || "default")}
                aria-label="Ordenar por"
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

        {activeCategories && visibleSubcategories.length > 0 && (
          <section className={styles.subcategoriesBar} aria-label="Subcategorías disponibles">
            <p>Subcategorías</p>
            <div className={styles.subcategoriesList}>
              <button
                type="button"
                className={`${styles.subcategoryChip} ${
                  !activeSubcategory ? styles.subcategoryChipActive : ""
                }`}
                onClick={() => setActiveSubcategory("")}
              >
                Todas
              </button>
              {visibleSubcategories.map((subcategory) => (
                <button
                  key={subcategory}
                  type="button"
                  className={`${styles.subcategoryChip} ${
                    activeSubcategory === subcategory ? styles.subcategoryChipActive : ""
                  }`}
                  onClick={() => setActiveSubcategory(subcategory)}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <p className={styles.state}>No se pudieron cargar los productos.</p>}
        {isLoading && <p className={styles.state}>Cargando catálogo...</p>}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <p className={styles.state}>No hay productos disponibles en esta categoría.</p>
        )}

        {!error && filteredProducts.length > 0 && showFlatList && <ProductGrid items={filteredProducts} />}

        {!error && filteredProducts.length > 0 && !showFlatList && (
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
