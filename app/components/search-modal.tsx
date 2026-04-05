"use client";

import Image from "next/image";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useProducts } from "@/lib/services/products";
import { type Product } from "@/lib/domain/product";
import { formatCOP } from "@/lib/utils/format";

import styles from "./search-modal.module.css";

const MAX_RESULTS = 50;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSearchTerms(product: Product) {
  return [
    product.name,
    product.description,
    product.slug,
    product.category,
    product.subcategory,
    product.brand,
    ...(product.variants?.color ?? []),
    ...(product.variants?.size ?? []),
    ...Object.values(product.attributes ?? {}).map((value) => String(value)),
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalize(value));
}

export function SearchModal() {
  const router = useRouter();
  const { data: products = [], isLoading } = useProducts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];

    const tokens = term.split(/\s+/).filter(Boolean);

    return products
      .filter((product) => {
        const haystack = getSearchTerms(product);

        return tokens.every((token) =>
          haystack.some((value) => value.includes(token)),
        );
      })
      .slice(0, MAX_RESULTS);
  }, [products, query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeModal = () => {
    setOpen(false);
    setQuery("");
  };

  const openModal = () => {
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={openModal}
        aria-label="Buscar productos"
      >
        <Search className={styles.triggerIcon} />
        <span className={styles.triggerText}>Buscar productos...</span>
      </button>

      {open && (
        <div className={styles.backdrop} onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTop}>
              <Search />
              <input
                autoFocus
                type="text"
                className={styles.modalInput}
                placeholder="Escribe para buscar productos..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Cerrar búsqueda"
              >
                <X />
              </button>
            </div>

            <div className={styles.results}>
              {!query.trim() && (
                <p className={styles.state}>
                  Escribe el nombre del producto que estás buscando.
                </p>
              )}
              {!!query.trim() && isLoading && (
                <p className={styles.state}>Buscando productos...</p>
              )}
              {!!query.trim() && !isLoading && results.length === 0 && (
                <p className={styles.state}>
                  No encontramos productos relacionados.
                </p>
              )}

              {results.map((product) => {
                const image =
                  product.images[0] ??
                  "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";
                return (
                  <button
                    key={product.id}
                    type="button"
                    className={styles.resultItem}
                    onClick={() => {
                      closeModal();
                      router.push(`/productos/${product.slug}`);
                    }}
                  >
                    <div className={styles.resultImageWrap}>
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="66px"
                        className={styles.resultImage}
                      />
                    </div>
                    <div className={styles.resultBody}>
                      <h3>{product.name}</h3>
                      <div className={styles.resultMeta}>
                        <span>
                          {product.brand ?? product.subcategory ?? product.category}
                        </span>
                        <strong>{formatCOP(product.price)}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
              {!!query.trim() && results.length >= MAX_RESULTS && (
                <p className={styles.state}>
                  Mostrando los primeros {MAX_RESULTS} resultados. Refina la búsqueda si necesitas encontrar un producto más específico.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
