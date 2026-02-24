"use client";

import { Manrope, Sora } from "next/font/google";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { productCategories, type Product, type ProductCategory } from "@/lib/domain/product";

import styles from "./page.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

type ProductForm = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  featured: boolean;
  images: string[];
  variantsJson: string;
  attributesJson: string;
};

const initialForm: ProductForm = {
  id: "",
  slug: "",
  name: "",
  description: "",
  price: "",
  category: "technology",
  featured: false,
  images: [""],
  variantsJson: "",
  attributesJson: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function prettyJson(value: unknown): string {
  if (!value) return "";
  return JSON.stringify(value, null, 2);
}

function toForm(product: Product): ProductForm {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: String(product.price),
    category: product.category,
    featured: product.featured,
    images: product.images.length > 0 ? product.images : [""],
    variantsJson: prettyJson(product.variants),
    attributesJson: prettyJson(product.attributes),
  };
}

function parseOptionalJson<T>(raw: string): T | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed) as T;
}

function cleanImages(images: string[]): string[] {
  return images.map((img) => img.trim()).filter((img) => img.length > 0);
}

function ImagePreview({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = src.trim();

  if (!cleanSrc) {
    return <p className={styles.previewHint}>Sin URL</p>;
  }

  if (hasError) {
    return <p className={styles.previewError}>No se pudo cargar esta imagen</p>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleanSrc}
      alt="Vista previa del producto"
      className={styles.imagePreview}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [slugEdited, setSlugEdited] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId],
  );

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      if (!response.ok) throw new Error();

      const data = (await response.json()) as Product[];
      setProducts(data);
    } catch {
      setError("No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleSelect(product: Product) {
    setSelectedId(product.id);
    setForm(toForm(product));
    setSlugEdited(true);
    setMessage("");
    setError("");
  }

  function handleNew() {
    setSelectedId("");
    setForm(initialForm);
    setSlugEdited(false);
    setMessage("");
    setError("");
  }

  function updateImage(index: number, value: string) {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  }

  function removeImageField(index: number) {
    setForm((prev) => {
      const next = prev.images.filter((_, idx) => idx !== index);
      return { ...prev, images: next.length > 0 ? next : [""] };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const variants = parseOptionalJson<Product["variants"]>(form.variantsJson);
      const attributes = parseOptionalJson<Product["attributes"]>(form.attributesJson);
      const normalizedSlug = slugify(form.slug || form.name);

      if (!normalizedSlug) {
        setError("El slug no puede quedar vacío.");
        setSubmitting(false);
        return;
      }

      const slugTaken = products.some(
        (item) => item.slug === normalizedSlug && item.id !== (selectedId || ""),
      );

      if (slugTaken) {
        setError("Ese slug ya existe. Usa uno diferente.");
        setSubmitting(false);
        return;
      }

      const payload = {
        id: selectedId || undefined,
        slug: normalizedSlug,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        featured: form.featured,
        images: cleanImages(form.images),
        variants,
        attributes,
      };

      const method = selectedId ? "PUT" : "POST";
      const response = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || "No se pudo guardar.");
      }

      const saved = (await response.json()) as Product;
      await loadProducts();
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage(selectedId ? "Producto actualizado." : "Producto creado.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message ||
          "No se pudo guardar. Revisa que variants y attributes tengan JSON válido (o déjalos vacíos).",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;

    const shouldDelete = window.confirm("¿Seguro que quieres eliminar este producto?");
    if (!shouldDelete) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId }),
      });

      if (!response.ok) throw new Error();

      await loadProducts();
      handleNew();
      setMessage("Producto eliminado.");
    } catch {
      setError("No se pudo eliminar el producto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <section className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>Admin Productos</h1>
          <button type="button" onClick={handleNew}>
            Nuevo
          </button>
        </div>

        {loading && <p className={styles.muted}>Cargando...</p>}
        {!loading && products.length === 0 && <p className={styles.muted}>No hay productos.</p>}

        <div className={styles.productList}>
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className={selectedId === product.id ? styles.active : ""}
              onClick={() => handleSelect(product)}
            >
              <span>{product.name}</span>
              <small>{product.category}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.editor}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.topRow}>
            <h2>{selectedProduct ? "Editar producto" : "Crear producto"}</h2>
            <div className={styles.actions}>
              {selectedId && (
                <button type="button" className={styles.danger} onClick={handleDelete}>
                  Eliminar
                </button>
              )}
              <button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.grid}>
            <label>
              ID
              <input value={form.id} readOnly placeholder="Se genera automáticamente" />
            </label>

            <label>
              Slug
              <input
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setForm((prev) => ({ ...prev, slug: event.target.value }));
                }}
                placeholder="iphone-16-pro"
              />
            </label>

            <label>
              Nombre
              <input
                required
                value={form.name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name: nextName,
                    slug: !selectedId && !slugEdited ? slugify(nextName) : prev.slug,
                  }));
                }}
              />
            </label>

            <label>
              Precio (COP)
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </label>

            <label>
              Categoría
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value as ProductCategory }))
                }
              >
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
              />
              Destacado
            </label>
          </div>

          <label>
            Descripción
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <div className={styles.imagesBlock}>
            <p>Imágenes (URLs de Cloudinary)</p>
            {form.images.map((image, index) => (
              <div key={index} className={styles.imageItem}>
                <div className={styles.imageRow}>
                  <input
                    value={image}
                    placeholder="https://res.cloudinary.com/..."
                    onChange={(event) => updateImage(index, event.target.value)}
                  />
                  <button type="button" onClick={() => removeImageField(index)}>
                    Quitar
                  </button>
                </div>
                <ImagePreview key={`${index}-${image}`} src={image} />
              </div>
            ))}
            <button type="button" className={styles.secondaryButton} onClick={addImageField}>
              + Agregar imagen
            </button>
          </div>

          <label>
            Variants (JSON opcional)
            <textarea
              rows={5}
              value={form.variantsJson}
              placeholder='{"size": ["M", "L"], "color": ["black"]}'
              onChange={(event) => setForm((prev) => ({ ...prev, variantsJson: event.target.value }))}
            />
          </label>

          <label>
            Attributes (JSON opcional)
            <textarea
              rows={6}
              value={form.attributesJson}
              placeholder='{"brand": "Apple", "condition": "new"}'
              onChange={(event) => setForm((prev) => ({ ...prev, attributesJson: event.target.value }))}
            />
          </label>
        </form>
      </section>
    </main>
  );
}
