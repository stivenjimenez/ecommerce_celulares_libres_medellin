"use client";

import Image from "next/image";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useProducts } from "@/lib/services/products";
import { formatCOP } from "@/lib/utils/format";

import styles from "./search-modal.module.css";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function SearchModal() {
  const router = useRouter();
  const { data: products = [], isLoading } = useProducts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];

    return products
      .filter((product) => {
        const name = normalize(product.name);
        const description = normalize(product.description);
        return name.includes(term) || description.includes(term);
      })
      .slice(0, 12);
  }, [products, query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
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
      <button type="button" className={styles.trigger} onClick={openModal} aria-label="Buscar productos">
        <Search className={styles.triggerIcon} />
        <span className={styles.triggerText}>Buscar productos...</span>
      </button>

      {open && (
        <div className={styles.backdrop} onClick={closeModal}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
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
              <button type="button" className={styles.closeButton} onClick={closeModal} aria-label="Cerrar búsqueda">
                <X />
              </button>
            </div>

            <div className={styles.results}>
              {!query.trim() && (
                <p className={styles.state}>Escribe el nombre del producto que estás buscando.</p>
              )}
              {!!query.trim() && isLoading && <p className={styles.state}>Buscando productos...</p>}
              {!!query.trim() && !isLoading && results.length === 0 && (
                <p className={styles.state}>No encontramos productos relacionados.</p>
              )}

              {results.map((product) => {
                const image = product.images[0] ?? "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";
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
                      <Image src={image} alt={product.name} fill sizes="66px" className={styles.resultImage} />
                    </div>
                    <div className={styles.resultBody}>
                      <h3>{product.name}</h3>
                      <div className={styles.resultMeta}>
                        <span>{product.category}</span>
                        <strong>{formatCOP(product.price)}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
