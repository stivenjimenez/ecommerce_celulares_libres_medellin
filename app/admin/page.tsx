"use client";

import { Manrope, Sora } from "next/font/google";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FeaturedProductCard } from "@/app/components/featured-products-grid";
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
  draft: boolean;
  images: string[];
  variantsJson: string;
  attributesJson: string;
};

type PendingUpload = {
  tempUrl: string;
  file: File;
  name: string;
};

const initialForm: ProductForm = {
  id: "",
  slug: "",
  name: "",
  description: "",
  price: "",
  category: "technology",
  featured: false,
  draft: true,
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
    draft: product.draft === true,
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

type SortableProductItemProps = {
  product: Product;
  isActive: boolean;
  onSelect: (product: Product) => void;
};

function SortableProductItem({ product, isActive, onSelect }: SortableProductItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.productListItem} ${isActive ? styles.productListItemActive : ""} ${
        isDragging ? styles.productListItemDragging : ""
      }`}
    >
      <button
        type="button"
        className={styles.productDragHandle}
        aria-label={`Reordenar ${product.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </button>
      <button type="button" onClick={() => onSelect(product)}>
        <span className={styles.productName}>{product.name}</span>
        <span className={styles.productTags}>
          <span className={styles.tag}>{product.category}</span>
          {product.draft && <span className={`${styles.tag} ${styles.tagDraft}`}>draft</span>}
        </span>
      </button>
    </div>
  );
}

type SortableImageItemProps = {
  id: string;
  index: number;
  image: string;
  pendingName?: string;
  onRemove: (index: number) => void;
};

function SortableImageItem({ id, index, image, pendingName, onRemove }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const cleanImage = image.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.imageItem} ${isDragging ? styles.imageItemDragging : ""}`}
    >
      <div className={styles.imageRow}>
        <button
          type="button"
          className={styles.imageDragHandle}
          aria-label={`Mover imagen ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className={styles.imageDragIcon} aria-hidden="true" />
        </button>
        <div className={styles.imageThumbWrap}>
          {cleanImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cleanImage} alt="Miniatura" className={styles.imageThumb} />
          ) : (
            <p className={styles.previewHint}>Sin imagen</p>
          )}
        </div>
        <div className={styles.imageMeta}>
          <p className={styles.imageMetaTitle}>{pendingName ?? `Imagen ${index + 1}`}</p>
          <span className={styles.imageMetaSub}>
            {pendingName ? "Pendiente de subir al guardar" : cleanImage}
          </span>
        </div>
        <button type="button" onClick={() => onRemove(index)}>
          Quitar
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId],
  );
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [products, productSearch]);
  const galleryImages = useMemo(() => cleanImages(form.images), [form.images]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const productOrderIds = useMemo(() => filteredProducts.map((product) => product.id), [filteredProducts]);
  const imageOrderIds = useMemo(
    () => form.images.map((_, index) => `image-${index}`),
    [form.images],
  );
  const previewProduct = useMemo<Product>(() => {
    return {
      id: form.id || "preview-product",
      slug: form.slug || slugify(form.name) || "preview-product",
      name: form.name || "Nombre del producto",
      description: form.description || "Descripción del producto para vista previa en admin.",
      price: Number(form.price) > 0 ? Number(form.price) : 0,
      images: galleryImages,
      category: form.category,
      featured: form.featured,
      draft: form.draft,
    };
  }, [form, galleryImages]);

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
    clearPendingUploads();
    setSelectedId(product.id);
    setForm(toForm(product));
    setError("");
  }

  function handleNew() {
    clearPendingUploads();
    setSelectedId("");
    setForm(initialForm);
    setError("");
  }

  function clearPendingUploads() {
    setPendingUploads((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.tempUrl));
      return [];
    });
  }

  function removePendingUploadsByUrls(urls: string[]) {
    if (urls.length === 0) return;
    const toRemove = new Set(urls);

    setPendingUploads((prev) => {
      prev.forEach((item) => {
        if (toRemove.has(item.tempUrl)) {
          URL.revokeObjectURL(item.tempUrl);
        }
      });

      return prev.filter((item) => !toRemove.has(item.tempUrl));
    });
  }

  function removeImageField(index: number) {
    const removedImage = form.images[index];
    if (removedImage) {
      removePendingUploadsByUrls([removedImage]);
    }

    setForm((prev) => {
      const next = prev.images.filter((_, idx) => idx !== index);
      return { ...prev, images: next.length > 0 ? next : [""] };
    });
  }

  function reorderProductsInMemory(items: Product[], fromId: string, toId: string): Product[] {
    if (fromId === toId) return items;
    const fromIndex = items.findIndex((product) => product.id === fromId);
    const toIndex = items.findIndex((product) => product.id === toId);
    if (fromIndex < 0 || toIndex < 0) return items;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return items;
    next.splice(toIndex, 0, moved);
    return next;
  }

  async function persistProductOrder(ids: string[]) {
    setSavingOrder(true);
    try {
      const response = await fetch("/api/admin/products/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || "No se pudo guardar el orden.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar el orden.";
      setError(msg);
      await loadProducts();
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleProductsSortEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromId = String(active.id);
    const toId = String(over.id);
    const nextProducts = reorderProductsInMemory(products, fromId, toId);
    setProducts(nextProducts);
    await persistProductOrder(nextProducts.map((product) => product.id));
  }

  function handleImagesSortEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = Number(String(active.id).replace("image-", ""));
    const toIndex = Number(String(over.id).replace("image-", ""));
    if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;

    setForm((prev) => ({ ...prev, images: arrayMove(prev.images, fromIndex, toIndex) }));
  }

  async function uploadFilesToCloudinary(files: File[]): Promise<string[]> {
    const payload = new FormData();
    files.forEach((file) => payload.append("files", file));

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: payload,
    });

    const body = (await response.json().catch(() => null)) as
      | { urls?: string[]; message?: string }
      | null;

    if (!response.ok || !body?.urls || body.urls.length === 0) {
      throw new Error(body?.message || "No se pudo subir las imágenes.");
    }

    return body.urls;
  }

  function queuePendingFiles(files: File[]) {
    if (files.length === 0) return;

    const pendingToAdd = files.map((file) => ({
      tempUrl: URL.createObjectURL(file),
      file,
      name: file.name,
    }));

    setPendingUploads((prev) => [...prev, ...pendingToAdd]);
    setForm((prev) => {
      const nextImages = [...cleanImages(prev.images), ...pendingToAdd.map((item) => item.tempUrl)];
      return { ...prev, images: nextImages.length > 0 ? nextImages : [""] };
    });
  }

  async function handleImagesUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    queuePendingFiles(images);
    event.target.value = "";
  }

  function handleUploadDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsUploadDragActive(true);
  }

  function handleUploadDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsUploadDragActive(false);
  }

  async function handleUploadDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsUploadDragActive(false);

    const files = Array.from(event.dataTransfer.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) return;
    queuePendingFiles(files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
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

      const imageOrder = cleanImages(form.images);
      const pendingByTempUrl = new Map(pendingUploads.map((item) => [item.tempUrl, item.file]));
      const pendingInOrder = imageOrder
        .map((image) => pendingByTempUrl.get(image))
        .filter((file): file is File => Boolean(file));

      let finalImages = imageOrder;
      if (pendingInOrder.length > 0) {
        const uploadedUrls = await uploadFilesToCloudinary(pendingInOrder);
        let uploadIndex = 0;
        finalImages = imageOrder.map((image) => {
          if (pendingByTempUrl.has(image)) {
            const uploaded = uploadedUrls[uploadIndex];
            uploadIndex += 1;
            return uploaded ?? image;
          }
          return image;
        });
        clearPendingUploads();
        setForm((prev) => ({ ...prev, images: finalImages }));
      }

      const payload = {
        id: selectedId || undefined,
        slug: normalizedSlug,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        featured: form.featured,
        draft: form.draft,
        images: finalImages,
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

      await response.json();
      clearPendingUploads();
      await loadProducts();
      setSelectedId("");
      setForm(initialForm);
      toast.success(selectedId ? "Producto actualizado con éxito." : "Producto creado con éxito.");
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
      toast.success("Producto eliminado.");
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
        <input
          className={styles.productSearchInput}
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
          placeholder="Buscar producto..."
          aria-label="Buscar producto"
        />

        <div className={styles.sidebarStatus}>
          {loading && <p className={styles.muted}>Cargando...</p>}
          {!loading && products.length === 0 && <p className={styles.muted}>No hay productos.</p>}
          {!loading && products.length > 0 && filteredProducts.length === 0 && (
            <p className={styles.muted}>No hay resultados para esa búsqueda.</p>
          )}
          {savingOrder && <p className={styles.muted}>Guardando orden...</p>}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductsSortEnd}>
          <SortableContext items={productOrderIds} strategy={verticalListSortingStrategy}>
            <div className={styles.productList}>
              {filteredProducts.map((product) => (
                <SortableProductItem
                  key={product.id}
                  product={product}
                  isActive={selectedId === product.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section className={styles.editor}>
        <div className={styles.editorLayout}>
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
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
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
                    slug: slugify(nextName),
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

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.draft}
                onChange={(event) => setForm((prev) => ({ ...prev, draft: event.target.checked }))}
              />
              Draft (oculto en tienda)
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
            <div className={styles.imagesHeader}>
              <p>Imágenes de producto</p>
              <label className={styles.uploadButton}>
                Seleccionar imágenes
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={submitting}
                  onChange={handleImagesUpload}
                />
              </label>
            </div>
            <div
              className={`${styles.uploadDropzone} ${isUploadDragActive ? styles.uploadDropzoneActive : ""}`}
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
            >
              <strong>Arrastra una o varias imágenes aquí</strong>
              <span>Se subirán a Cloudinary solo cuando presiones Guardar.</span>
            </div>
            {pendingUploads.length > 0 && (
              <p className={styles.pendingHint}>
                {pendingUploads.length} imagen(es) pendiente(s) de subir.
              </p>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImagesSortEnd}>
              <SortableContext items={imageOrderIds} strategy={verticalListSortingStrategy}>
                {form.images.map((image, index) => {
                  const pendingItem = pendingUploads.find((item) => item.tempUrl === image);

                  return (
                    <SortableImageItem
                      key={`image-${index}`}
                      id={`image-${index}`}
                      index={index}
                      image={image}
                      pendingName={pendingItem?.name}
                      onRemove={removeImageField}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
            {form.images.length === 0 && (
              <div className={styles.imageItem}>
                <div className={styles.imageRow}>
                  <div className={styles.imageThumbWrap}>
                    <p className={styles.previewHint}>Sin imagen</p>
                  </div>
                  <div className={styles.imageMeta}>
                    <p className={styles.imageMetaTitle}>No hay imágenes todavía</p>
                    <span className={styles.imageMetaSub}>Arrastra o selecciona archivos arriba</span>
                  </div>
                </div>
              </div>
            )}
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

          <aside className={styles.previewPanel}>
            <h3>Preview tarjeta</h3>
            <p>Componente real del catálogo.</p>

            <div className={styles.realCardPreview}>
              <FeaturedProductCard product={previewProduct} interactive={false} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
