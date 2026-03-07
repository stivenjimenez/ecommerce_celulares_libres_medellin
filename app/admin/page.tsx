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
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
	productCategories,
	type Brand,
	type Product,
	type ProductCategory,
	type Subcategory,
} from "@/lib/domain/product";

import styles from "./page.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

type ProductForm = {
	id: string;
	slug: string;
	name: string;
	description: string;
	price: string;
	previousPrice: string;
	category: ProductCategory;
	subcategory: string;
	brand: string;
	featured: boolean;
	draft: boolean;
	images: string[];
	variantsJson: string;
	attributesJson: string;
};

type SubcategoryForm = {
	id: string;
	slug: string;
	name: string;
	category: ProductCategory;
};

type BrandForm = {
	id: string;
	slug: string;
	name: string;
	category: ProductCategory;
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
	previousPrice: "",
	category: "technology",
	subcategory: "",
	brand: "",
	featured: false,
	draft: true,
	images: [""],
	variantsJson: "",
	attributesJson: "",
};

const initialSubcategoryForm: SubcategoryForm = {
	id: "",
	slug: "",
	name: "",
	category: "technology",
};

const initialBrandForm: BrandForm = {
	id: "",
	slug: "",
	name: "",
	category: "technology",
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
		previousPrice: product.previousPrice ? String(product.previousPrice) : "",
		category: product.category,
		subcategory: product.subcategory ?? "",
		brand: product.brand ?? "",
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

function formatMoney(value: number): string {
	return new Intl.NumberFormat("es-CO", {
		style: "currency",
		currency: "COP",
		maximumFractionDigits: 0,
	}).format(value);
}

type SortableImageItemProps = {
	id: string;
	index: number;
	image: string;
	pendingName?: string;
	onRemove: (index: number) => void;
};

function SortableImageItem({
	id,
	index,
	image,
	pendingName,
	onRemove,
}: SortableImageItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
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
						<img
							src={cleanImage}
							alt="Miniatura"
							className={styles.imageThumb}
						/>
					) : (
						<p className={styles.previewHint}>Sin imagen</p>
					)}
				</div>
				<div className={styles.imageMeta}>
					<p className={styles.imageMetaTitle}>
						{pendingName ?? `Imagen ${index + 1}`}
					</p>
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
	const [adminSection, setAdminSection] = useState<"products" | "subcategories" | "brands">(
		"products",
	);
	const [products, setProducts] = useState<Product[]>([]);
	const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [selectedId, setSelectedId] = useState<string>("");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [subcatSelectedId, setSubcatSelectedId] = useState<string>("");
	const [subcatDrawerOpen, setSubcatDrawerOpen] = useState(false);
	const [brandSelectedId, setBrandSelectedId] = useState<string>("");
	const [brandDrawerOpen, setBrandDrawerOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [subcatLoading, setSubcatLoading] = useState(true);
	const [brandLoading, setBrandLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [subcatSubmitting, setSubcatSubmitting] = useState(false);
	const [brandSubmitting, setBrandSubmitting] = useState(false);
	const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
	const [isUploadDragActive, setIsUploadDragActive] = useState(false);
	const [productSearch, setProductSearch] = useState("");
	const [subcategorySearch, setSubcategorySearch] = useState("");
	const [brandSearch, setBrandSearch] = useState("");
	const [error, setError] = useState<string>("");
	const [subcatError, setSubcatError] = useState<string>("");
	const [brandError, setBrandError] = useState<string>("");
	const [showDraftOnly, setShowDraftOnly] = useState(false);
	const [updatingFeaturedId, setUpdatingFeaturedId] = useState<string>("");

	const {
		register,
		reset,
		setValue,
		getValues,
		control,
		handleSubmit: handleFormSubmit,
	} = useForm<ProductForm>({
		defaultValues: initialForm,
	});
	const {
		register: registerSubcat,
		reset: resetSubcatForm,
		setValue: setSubcatValue,
		control: subcatControl,
		handleSubmit: handleSubcatFormSubmit,
	} = useForm<SubcategoryForm>({
		defaultValues: initialSubcategoryForm,
	});
	const {
		register: registerBrand,
		reset: resetBrandForm,
		setValue: setBrandValue,
		control: brandControl,
		handleSubmit: handleBrandFormSubmit,
	} = useForm<BrandForm>({
		defaultValues: initialBrandForm,
	});

	const formWatch = useWatch({ control });
	const form = (formWatch ?? initialForm) as ProductForm;
	const subcatFormWatch = useWatch({ control: subcatControl });
	const subcatForm = (subcatFormWatch ?? initialSubcategoryForm) as SubcategoryForm;
	const brandFormWatch = useWatch({ control: brandControl });
	const brandForm = (brandFormWatch ?? initialBrandForm) as BrandForm;

	const selectedProduct = useMemo(
		() => products.find((product) => product.id === selectedId) ?? null,
		[products, selectedId],
	);
	const selectedSubcategory = useMemo(
		() => subcategories.find((subcategory) => subcategory.id === subcatSelectedId) ?? null,
		[subcategories, subcatSelectedId],
	);
	const selectedBrand = useMemo(
		() => brands.find((brand) => brand.id === brandSelectedId) ?? null,
		[brands, brandSelectedId],
	);

	const draftCount = useMemo(
		() => products.filter((p) => p.draft).length,
		[products],
	);

	const filteredProducts = useMemo(() => {
		const result = showDraftOnly ? products.filter((p) => p.draft) : products;
		const query = productSearch.trim().toLowerCase();
		if (!query) return result;

		return result.filter((product) => {
			return (
				product.name.toLowerCase().includes(query) ||
				product.slug.toLowerCase().includes(query) ||
				product.category.toLowerCase().includes(query) ||
				(product.subcategory ?? "").toLowerCase().includes(query) ||
				(product.brand ?? "").toLowerCase().includes(query)
			);
		});
	}, [products, productSearch, showDraftOnly]);

	const filteredSubcategories = useMemo(() => {
		const query = subcategorySearch.trim().toLowerCase();
		if (!query) return subcategories;

		return subcategories.filter((subcategory) => {
			return (
				subcategory.name.toLowerCase().includes(query) ||
				subcategory.slug.toLowerCase().includes(query) ||
				subcategory.category.toLowerCase().includes(query)
			);
		});
	}, [subcategories, subcategorySearch]);

	const filteredBrands = useMemo(() => {
		const query = brandSearch.trim().toLowerCase();
		if (!query) return brands;

		return brands.filter((brand) => {
			return (
				brand.name.toLowerCase().includes(query) ||
				brand.slug.toLowerCase().includes(query) ||
				brand.category.toLowerCase().includes(query)
			);
		});
	}, [brands, brandSearch]);

	const selectableSubcategories = useMemo(() => {
		return subcategories.filter(
			(subcategory) => subcategory.category === form.category,
		);
	}, [subcategories, form.category]);

	const selectableBrands = useMemo(() => {
		return brands.filter((brand) => brand.category === form.category);
	}, [brands, form.category]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 180, tolerance: 8 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const imageOrderIds = useMemo(
		() => form.images.map((_, index) => `image-${index}`),
		[form.images],
	);
	const nameField = register("name", { required: true });
	const subcatNameField = registerSubcat("name", { required: true });
	const brandNameField = registerBrand("name", { required: true });

	async function loadProducts() {
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/admin/products", {
				cache: "no-store",
			});
			if (!response.ok) throw new Error();

			const data = (await response.json()) as Product[];
			setProducts(data);
		} catch {
			setError("No se pudo cargar el catálogo.");
		} finally {
			setLoading(false);
		}
	}

	async function loadSubcategories() {
		setSubcatLoading(true);
		setSubcatError("");

		try {
			const response = await fetch("/api/admin/subcategories", {
				cache: "no-store",
			});
			if (!response.ok) throw new Error();
			const data = (await response.json()) as Subcategory[];
			setSubcategories(data);
		} catch {
			setSubcatError("No se pudieron cargar las subcategorías.");
		} finally {
			setSubcatLoading(false);
		}
	}

	async function loadBrands() {
		setBrandLoading(true);
		setBrandError("");

		try {
			const response = await fetch("/api/admin/brands", { cache: "no-store" });
			if (!response.ok) throw new Error();
			const data = (await response.json()) as Brand[];
			setBrands(data);
		} catch {
			setBrandError("No se pudieron cargar las marcas.");
		} finally {
			setBrandLoading(false);
		}
	}

	useEffect(() => {
		loadProducts();
		loadSubcategories();
		loadBrands();
	}, []);

	useEffect(() => {
		if (!form.subcategory) return;
		const exists = selectableSubcategories.some(
			(item) => item.name === form.subcategory,
		);
		if (!exists) {
			setValue("subcategory", "", { shouldDirty: true });
		}
	}, [form.subcategory, selectableSubcategories, setValue]);

	useEffect(() => {
		if (!form.brand) return;
		const exists = selectableBrands.some((item) => item.name === form.brand);
		if (!exists) {
			setValue("brand", "", { shouldDirty: true });
		}
	}, [form.brand, selectableBrands, setValue]);

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

	function openDrawerForNew() {
		clearPendingUploads();
		setSelectedId("");
		reset(initialForm);
		setError("");
		setDrawerOpen(true);
	}

	function openDrawerForEdit(product: Product) {
		clearPendingUploads();
		setSelectedId(product.id);
		reset(toForm(product));
		setError("");
		setDrawerOpen(true);
	}

	function closeDrawer() {
		clearPendingUploads();
		setSelectedId("");
		reset(initialForm);
		setError("");
		setDrawerOpen(false);
	}

	function openSubcatDrawerForNew() {
		setSubcatSelectedId("");
		resetSubcatForm(initialSubcategoryForm);
		setSubcatError("");
		setSubcatDrawerOpen(true);
	}

	function openSubcatDrawerForEdit(subcategory: Subcategory) {
		setSubcatSelectedId(subcategory.id);
		resetSubcatForm({
			id: subcategory.id,
			slug: subcategory.slug,
			name: subcategory.name,
			category: subcategory.category,
		});
		setSubcatError("");
		setSubcatDrawerOpen(true);
	}

	function closeSubcatDrawer() {
		setSubcatSelectedId("");
		resetSubcatForm(initialSubcategoryForm);
		setSubcatError("");
		setSubcatDrawerOpen(false);
	}

	function openBrandDrawerForNew() {
		setBrandSelectedId("");
		resetBrandForm(initialBrandForm);
		setBrandError("");
		setBrandDrawerOpen(true);
	}

	function openBrandDrawerForEdit(brand: Brand) {
		setBrandSelectedId(brand.id);
		resetBrandForm({
			id: brand.id,
			slug: brand.slug,
			name: brand.name,
			category: brand.category,
		});
		setBrandError("");
		setBrandDrawerOpen(true);
	}

	function closeBrandDrawer() {
		setBrandSelectedId("");
		resetBrandForm(initialBrandForm);
		setBrandError("");
		setBrandDrawerOpen(false);
	}

	function removeImageField(index: number) {
		const currentImages = getValues("images") ?? [];
		const removedImage = currentImages[index];
		if (removedImage) {
			removePendingUploadsByUrls([removedImage]);
		}

		const next = currentImages.filter((_, idx) => idx !== index);
		setValue("images", next.length > 0 ? next : [""], { shouldDirty: true });
	}

	function handleImagesSortEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const fromIndex = Number(String(active.id).replace("image-", ""));
		const toIndex = Number(String(over.id).replace("image-", ""));
		if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;

		const currentImages = getValues("images") ?? [];
		setValue("images", arrayMove(currentImages, fromIndex, toIndex), {
			shouldDirty: true,
		});
	}

	async function uploadFilesToCloudinary(files: File[]): Promise<string[]> {
		const payload = new FormData();
		files.forEach((file) => payload.append("files", file));

		const response = await fetch("/api/admin/uploads", {
			method: "POST",
			body: payload,
		});

		const body = (await response.json().catch(() => null)) as {
			urls?: string[];
			message?: string;
		} | null;

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
		const currentImages = getValues("images") ?? [];
		const nextImages = [
			...cleanImages(currentImages),
			...pendingToAdd.map((item) => item.tempUrl),
		];
		setValue("images", nextImages.length > 0 ? nextImages : [""], {
			shouldDirty: true,
		});
	}

	async function handleImagesUpload(event: ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (!files || files.length === 0) return;
		const images = Array.from(files).filter((file) =>
			file.type.startsWith("image/"),
		);
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

	async function handleToggleFeatured(product: Product, nextFeatured: boolean) {
		setUpdatingFeaturedId(product.id);
		setError("");

		try {
			const response = await fetch("/api/admin/products", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...product, featured: nextFeatured }),
			});

			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as {
					message?: string;
				} | null;
				throw new Error(body?.message || "No se pudo actualizar destacado.");
			}

			const updated = (await response.json()) as Product;
			setProducts((prev) =>
				prev.map((item) => (item.id === updated.id ? updated : item)),
			);

			if (selectedId === updated.id) {
				setValue("featured", updated.featured, { shouldDirty: true });
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "No se pudo actualizar destacado.";
			setError(message);
		} finally {
			setUpdatingFeaturedId("");
		}
	}

	const handleSubmit = handleFormSubmit(async (values) => {
		setSubmitting(true);
		setError("");

		try {
			const variants = parseOptionalJson<Product["variants"]>(
				values.variantsJson,
			);
			const attributes = parseOptionalJson<Product["attributes"]>(
				values.attributesJson,
			);
			const normalizedSlug = slugify(values.slug || values.name);

			if (!normalizedSlug) {
				setError("El slug no puede quedar vacío.");
				setSubmitting(false);
				return;
			}

			const slugTaken = products.some(
				(item) =>
					item.slug === normalizedSlug && item.id !== (selectedId || ""),
			);

			if (slugTaken) {
				setError("Ese slug ya existe. Usa uno diferente.");
				setSubmitting(false);
				return;
			}

			const imageOrder = cleanImages(values.images);
			const pendingByTempUrl = new Map(
				pendingUploads.map((item) => [item.tempUrl, item.file]),
			);
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
				setValue("images", finalImages, { shouldDirty: true });
			}

			const payload = {
				id: selectedId || undefined,
				slug: normalizedSlug,
				name: values.name,
				description: values.description,
				price: Number(values.price),
				previousPrice: values.previousPrice
					? Number(values.previousPrice)
					: undefined,
				category: values.category,
				subcategory: values.subcategory.trim() || undefined,
				brand: values.brand.trim() || undefined,
				featured: values.featured,
				draft: values.draft,
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
				const body = (await response.json().catch(() => null)) as {
					message?: string;
				} | null;
				throw new Error(body?.message || "No se pudo guardar.");
			}

			await response.json();
			clearPendingUploads();
			await loadProducts();
			closeDrawer();
			toast.success(
				selectedId
					? "Producto actualizado con éxito."
					: "Producto creado con éxito.",
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : "";
			setError(
				message ||
					"No se pudo guardar. Revisa que variants y attributes tengan JSON válido (o déjalos vacíos).",
			);
		} finally {
			setSubmitting(false);
		}
	});

	async function handleDelete() {
		if (!selectedId) return;

		const shouldDelete = window.confirm(
			"¿Seguro que quieres eliminar este producto?",
		);
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
			closeDrawer();
			toast.success("Producto eliminado.");
		} catch {
			setError("No se pudo eliminar el producto.");
		} finally {
			setSubmitting(false);
		}
	}

	const handleSubcategorySubmit = handleSubcatFormSubmit(async (values) => {
		setSubcatSubmitting(true);
		setSubcatError("");

		try {
			const payload = {
				id: subcatSelectedId || undefined,
				name: values.name.trim(),
				slug: slugify(values.slug || values.name),
				category: values.category,
			};

			if (!payload.name) {
				setSubcatError("El nombre de la subcategoría es obligatorio.");
				setSubcatSubmitting(false);
				return;
			}

			const method = subcatSelectedId ? "PUT" : "POST";
			const response = await fetch("/api/admin/subcategories", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as {
					message?: string;
				} | null;
				throw new Error(body?.message || "No se pudo guardar la subcategoría.");
			}

			await response.json();
			await loadSubcategories();
			closeSubcatDrawer();
			toast.success(
				subcatSelectedId ? "Subcategoría actualizada." : "Subcategoría creada.",
			);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "No se pudo guardar la subcategoría.";
			setSubcatError(message);
		} finally {
			setSubcatSubmitting(false);
		}
	});

	async function handleDeleteSubcategory() {
		if (!subcatSelectedId) return;

		const inUse = products.some(
			(product) => product.subcategory === selectedSubcategory?.name,
		);
		if (inUse) {
			setSubcatError(
				"No puedes eliminarla porque está asignada a uno o más productos.",
			);
			return;
		}

		const shouldDelete = window.confirm(
			"¿Seguro que quieres eliminar esta subcategoría?",
		);
		if (!shouldDelete) return;

		setSubcatSubmitting(true);
		setSubcatError("");

		try {
			const response = await fetch("/api/admin/subcategories", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: subcatSelectedId }),
			});

			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as {
					message?: string;
				} | null;
				throw new Error(
					body?.message || "No se pudo eliminar la subcategoría.",
				);
			}

			await loadSubcategories();
			closeSubcatDrawer();
			toast.success("Subcategoría eliminada.");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "No se pudo eliminar la subcategoría.";
			setSubcatError(message);
		} finally {
			setSubcatSubmitting(false);
		}
	}

	const handleBrandSubmit = handleBrandFormSubmit(async (values) => {
		setBrandSubmitting(true);
		setBrandError("");

		try {
			const payload = {
				id: brandSelectedId || undefined,
				name: values.name.trim(),
				slug: slugify(values.slug || values.name),
				category: values.category,
			};

			if (!payload.name) {
				setBrandError("El nombre de la marca es obligatorio.");
				setBrandSubmitting(false);
				return;
			}

			const method = brandSelectedId ? "PUT" : "POST";
			const response = await fetch("/api/admin/brands", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(body?.message || "No se pudo guardar la marca.");
			}

			await response.json();
			await loadBrands();
			closeBrandDrawer();
			toast.success(brandSelectedId ? "Marca actualizada." : "Marca creada.");
		} catch (err) {
			const message = err instanceof Error ? err.message : "No se pudo guardar la marca.";
			setBrandError(message);
		} finally {
			setBrandSubmitting(false);
		}
	});

	async function handleDeleteBrand() {
		if (!brandSelectedId) return;

		const inUse = products.some((product) => product.brand === selectedBrand?.name);
		if (inUse) {
			setBrandError("No puedes eliminarla porque está asignada a uno o más productos.");
			return;
		}

		const shouldDelete = window.confirm("¿Seguro que quieres eliminar esta marca?");
		if (!shouldDelete) return;

		setBrandSubmitting(true);
		setBrandError("");

		try {
			const response = await fetch("/api/admin/brands", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: brandSelectedId }),
			});

			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(body?.message || "No se pudo eliminar la marca.");
			}

			await loadBrands();
			closeBrandDrawer();
			toast.success("Marca eliminada.");
		} catch (err) {
			const message = err instanceof Error ? err.message : "No se pudo eliminar la marca.";
			setBrandError(message);
		} finally {
			setBrandSubmitting(false);
		}
	}

	return (
		<main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
			<nav className={styles.adminNav} aria-label="Secciones de admin">
				<button
					type="button"
					className={`${styles.adminNavButton} ${adminSection === "products" ? styles.adminNavButtonActive : ""}`}
					onClick={() => setAdminSection("products")}
				>
					Productos
				</button>
				<button
					type="button"
					className={`${styles.adminNavButton} ${adminSection === "subcategories" ? styles.adminNavButtonActive : ""}`}
					onClick={() => setAdminSection("subcategories")}
				>
					Subcategorías
				</button>
				<button
					type="button"
					className={`${styles.adminNavButton} ${adminSection === "brands" ? styles.adminNavButtonActive : ""}`}
					onClick={() => setAdminSection("brands")}
				>
					Marcas
				</button>
			</nav>

			{adminSection === "products" && (
			<section className={styles.tableSection}>
				<div className={styles.headerRow}>
					<div>
						<h1>Admin Productos</h1>
						<p>Gestiona catálogo desde una sola tabla.</p>
					</div>
					<button type="button" onClick={openDrawerForNew}>
						Nuevo
					</button>
				</div>

				<div className={styles.toolbar}>
					<input
						className={styles.productSearchInput}
						value={productSearch}
						onChange={(event) => setProductSearch(event.target.value)}
						placeholder="Buscar producto..."
						aria-label="Buscar producto"
					/>

					{!loading && products.length > 0 && (
						<div className={styles.filterTabs}>
							<button
								type="button"
								className={`${styles.filterTab} ${!showDraftOnly ? styles.filterTabActive : ""}`}
								onClick={() => setShowDraftOnly(false)}
							>
								Todos
								<span className={styles.filterTabBadge}>{products.length}</span>
							</button>
							<button
								type="button"
								className={`${styles.filterTab} ${showDraftOnly ? styles.filterTabActive : ""}`}
								onClick={() => setShowDraftOnly(true)}
							>
								Draft
								<span
									className={`${styles.filterTabBadge} ${styles.filterTabBadgeDraft}`}
								>
									{draftCount}
								</span>
							</button>
						</div>
					)}
				</div>

				{error && <p className={styles.error}>{error}</p>}

				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Imagen</th>
								<th>Nombre</th>
								<th>Categoría</th>
								<th>Subcategoría</th>
								<th>Marca</th>
								<th>Precio</th>
								<th>Estado</th>
								<th>Destacado</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{loading && (
								<tr>
									<td colSpan={9} className={styles.mutedCell}>
										Cargando...
									</td>
								</tr>
							)}

							{!loading && products.length === 0 && (
								<tr>
									<td colSpan={9} className={styles.mutedCell}>
										No hay productos.
									</td>
								</tr>
							)}

							{!loading &&
								products.length > 0 &&
								filteredProducts.length === 0 && (
									<tr>
										<td colSpan={9} className={styles.mutedCell}>
											No hay resultados para esa búsqueda.
										</td>
									</tr>
								)}

							{!loading &&
								filteredProducts.map((product) => (
									<tr
										key={product.id}
										className={styles.tableRowClickable}
										onClick={() => openDrawerForEdit(product)}
									>
										<td>
											<div className={styles.tableImageWrap}>
												{product.images[0] ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={product.images[0]}
														alt={product.name}
														className={styles.tableImage}
													/>
												) : (
													<span className={styles.tableImageEmpty}>
														Sin imagen
													</span>
												)}
											</div>
										</td>
										<td>
											<button
												type="button"
												className={styles.tableNameButton}
												onClick={(event) => {
													event.stopPropagation();
													openDrawerForEdit(product);
												}}
											>
												{product.name}
											</button>
										</td>
										<td>
											<span className={styles.tag}>{product.category}</span>
										</td>
										<td>
											{product.subcategory ? (
												<span className={styles.tag}>{product.subcategory}</span>
											) : (
												<span className={styles.muted}>—</span>
											)}
										</td>
										<td>
											{product.brand ? (
												<span className={styles.tag}>{product.brand}</span>
											) : (
												<span className={styles.muted}>—</span>
											)}
										</td>
										<td>{formatMoney(product.price)}</td>
										<td>
											{product.draft ? (
												<span className={`${styles.tag} ${styles.tagDraft}`}>
													draft
												</span>
											) : (
												<span
													className={`${styles.tag} ${styles.tagPublished}`}
												>
													activo
												</span>
											)}
										</td>
										<td>
											<label className={styles.tableCheckboxLabel}>
												<input
													type="checkbox"
													checked={product.featured}
													disabled={updatingFeaturedId === product.id}
													onClick={(event) => event.stopPropagation()}
													onChange={(event) =>
														handleToggleFeatured(product, event.target.checked)
													}
												/>
												<span>{product.featured ? "Sí" : "No"}</span>
											</label>
										</td>
										<td>
											<button
												type="button"
												className={styles.secondaryButton}
												onClick={(event) => {
													event.stopPropagation();
													openDrawerForEdit(product);
												}}
											>
												Editar
											</button>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</section>
			)}

			{adminSection === "subcategories" && (
			<section className={styles.tableSection}>
				<div className={styles.headerRow}>
					<div>
						<h1>Admin Subcategorías</h1>
						<p>Crea subcategorías y asígnalas luego a productos.</p>
					</div>
					<button type="button" onClick={openSubcatDrawerForNew}>
						Nueva subcategoría
					</button>
				</div>

				<div className={styles.toolbar}>
					<input
						className={styles.productSearchInput}
						value={subcategorySearch}
						onChange={(event) => setSubcategorySearch(event.target.value)}
						placeholder="Buscar subcategoría..."
						aria-label="Buscar subcategoría"
					/>
				</div>

				{subcatError && <p className={styles.error}>{subcatError}</p>}

				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Nombre</th>
								<th>Slug</th>
								<th>Categoría</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{subcatLoading && (
								<tr>
									<td colSpan={4} className={styles.mutedCell}>
										Cargando...
									</td>
								</tr>
							)}

							{!subcatLoading && subcategories.length === 0 && (
								<tr>
									<td colSpan={4} className={styles.mutedCell}>
										No hay subcategorías.
									</td>
								</tr>
							)}

							{!subcatLoading &&
								subcategories.length > 0 &&
								filteredSubcategories.length === 0 && (
									<tr>
										<td colSpan={4} className={styles.mutedCell}>
											No hay resultados para esa búsqueda.
										</td>
									</tr>
								)}

							{!subcatLoading &&
								filteredSubcategories.map((subcategory) => (
									<tr key={subcategory.id}>
										<td>{subcategory.name}</td>
										<td>
											<span className={styles.tag}>{subcategory.slug}</span>
										</td>
										<td>
											<span className={styles.tag}>{subcategory.category}</span>
										</td>
										<td>
											<button
												type="button"
												className={styles.secondaryButton}
												onClick={() => openSubcatDrawerForEdit(subcategory)}
											>
												Editar
											</button>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</section>
			)}

			{adminSection === "brands" && (
			<section className={styles.tableSection}>
				<div className={styles.headerRow}>
					<div>
						<h1>Admin Marcas</h1>
						<p>Crea marcas y asígnalas luego a productos.</p>
					</div>
					<button type="button" onClick={openBrandDrawerForNew}>
						Nueva marca
					</button>
				</div>

				<div className={styles.toolbar}>
					<input
						className={styles.productSearchInput}
						value={brandSearch}
						onChange={(event) => setBrandSearch(event.target.value)}
						placeholder="Buscar marca..."
						aria-label="Buscar marca"
					/>
				</div>

				{brandError && <p className={styles.error}>{brandError}</p>}

				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Nombre</th>
								<th>Slug</th>
								<th>Categoría</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{brandLoading && (
								<tr>
									<td colSpan={4} className={styles.mutedCell}>
										Cargando...
									</td>
								</tr>
							)}

							{!brandLoading && brands.length === 0 && (
								<tr>
									<td colSpan={4} className={styles.mutedCell}>
										No hay marcas.
									</td>
								</tr>
							)}

							{!brandLoading && brands.length > 0 && filteredBrands.length === 0 && (
								<tr>
									<td colSpan={4} className={styles.mutedCell}>
										No hay resultados para esa búsqueda.
									</td>
								</tr>
							)}

							{!brandLoading &&
								filteredBrands.map((brand) => (
									<tr key={brand.id}>
										<td>{brand.name}</td>
										<td>
											<span className={styles.tag}>{brand.slug}</span>
										</td>
										<td>
											<span className={styles.tag}>{brand.category}</span>
										</td>
										<td>
											<button
												type="button"
												className={styles.secondaryButton}
												onClick={() => openBrandDrawerForEdit(brand)}
											>
												Editar
											</button>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</section>
			)}

			{drawerOpen && (
				<>
					<button
						type="button"
						className={styles.drawerBackdrop}
						onClick={closeDrawer}
						aria-label="Cerrar formulario"
					/>
					<aside
						className={styles.drawer}
						role="dialog"
						aria-modal="true"
						aria-label="Formulario de producto"
					>
						<form className={styles.form} onSubmit={handleSubmit}>
							<div className={styles.topRow}>
								<h2>
									{selectedProduct ? "Editar producto" : "Crear producto"}
								</h2>
								<div className={styles.actions}>
									<button
										type="button"
										className={styles.secondaryButton}
										onClick={closeDrawer}
										disabled={submitting}
									>
										Cerrar
									</button>
									{selectedId && (
										<button
											type="button"
											className={styles.danger}
											onClick={handleDelete}
										>
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
									<input
										value={form.id}
										readOnly
										placeholder="Se genera automáticamente"
									/>
								</label>

								<label>
									Slug
									<input {...register("slug")} placeholder="iphone-16-pro" />
								</label>

								<label>
									<span className={styles.labelText}>
										Nombre <span className={styles.requiredMark}>*</span>
									</span>
									<input
										required
										{...nameField}
										onChange={(event) => {
											const nextName = event.target.value;
											nameField.onChange(event);
											setValue("slug", slugify(nextName), {
												shouldDirty: true,
											});
										}}
									/>
								</label>

								<label>
									<span className={styles.labelText}>
										Precio (COP) <span className={styles.requiredMark}>*</span>
									</span>
									<input
										required
										type="number"
										min="0"
										{...register("price", { required: true })}
									/>
								</label>

								<label>
									Precio anterior (COP)
									<input
										type="number"
										min="0"
										{...register("previousPrice")}
										placeholder="Opcional"
									/>
								</label>

								<label>
									Categoría
									<select {...register("category")}>
										{productCategories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
								</label>

								<label>
									Subcategoría
									<select {...register("subcategory")}>
										<option value="">Sin subcategoría</option>
										{selectableSubcategories.map((subcategory) => (
											<option key={subcategory.id} value={subcategory.name}>
												{subcategory.name}
											</option>
										))}
									</select>
								</label>

								<label>
									Marca
									<select {...register("brand")}>
										<option value="">Sin marca</option>
										{selectableBrands.map((brand) => (
											<option key={brand.id} value={brand.name}>
												{brand.name}
											</option>
										))}
									</select>
								</label>

								<label className={styles.checkbox}>
									<input type="checkbox" {...register("featured")} />
									Destacado
								</label>

								<label className={styles.checkbox}>
									<input type="checkbox" {...register("draft")} />
									Draft (oculto en tienda)
								</label>
							</div>

							<label>
								Descripción
								<textarea rows={4} {...register("description")} />
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
									<span>
										Se subirán a Cloudinary solo cuando presiones Guardar.
									</span>
								</div>

								{pendingUploads.length > 0 && (
									<p className={styles.pendingHint}>
										{pendingUploads.length} imagen(es) pendiente(s) de subir.
									</p>
								)}

								<DndContext
									id="admin-images-dnd"
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={handleImagesSortEnd}
								>
									<SortableContext
										items={imageOrderIds}
										strategy={verticalListSortingStrategy}
									>
										{form.images.map((image, index) => {
											const pendingItem = pendingUploads.find(
												(item) => item.tempUrl === image,
											);

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
												<p className={styles.imageMetaTitle}>
													No hay imágenes todavía
												</p>
												<span className={styles.imageMetaSub}>
													Arrastra o selecciona archivos arriba
												</span>
											</div>
										</div>
									</div>
								)}
							</div>

							<label>
								Variants (JSON opcional)
								<textarea
									rows={5}
									{...register("variantsJson")}
									placeholder='{"size": ["M", "L"], "color": ["black"]}'
								/>
							</label>

							<label>
								Attributes (JSON opcional)
								<textarea
									rows={6}
									{...register("attributesJson")}
									placeholder='{"brand": "Apple", "condition": "new"}'
								/>
							</label>
						</form>
					</aside>
				</>
			)}

			{subcatDrawerOpen && (
				<>
					<button
						type="button"
						className={styles.drawerBackdrop}
						onClick={closeSubcatDrawer}
						aria-label="Cerrar formulario de subcategoría"
					/>
					<aside
						className={styles.drawer}
						role="dialog"
						aria-modal="true"
						aria-label="Formulario de subcategoría"
					>
						<form className={styles.form} onSubmit={handleSubcategorySubmit}>
							<div className={styles.topRow}>
								<h2>
									{selectedSubcategory
										? "Editar subcategoría"
										: "Crear subcategoría"}
								</h2>
								<div className={styles.actions}>
									<button
										type="button"
										className={styles.secondaryButton}
										onClick={closeSubcatDrawer}
										disabled={subcatSubmitting}
									>
										Cerrar
									</button>
									{subcatSelectedId && (
										<button
											type="button"
											className={styles.danger}
											onClick={handleDeleteSubcategory}
											disabled={subcatSubmitting}
										>
											Eliminar
										</button>
									)}
									<button type="submit" disabled={subcatSubmitting}>
										{subcatSubmitting ? "Guardando..." : "Guardar"}
									</button>
								</div>
							</div>

							{subcatError && <p className={styles.error}>{subcatError}</p>}

							<div className={styles.grid}>
								<label>
									ID
									<input
										value={subcatForm.id}
										readOnly
										placeholder="Se genera automáticamente"
									/>
								</label>

								<label>
									Slug
									<input
										{...registerSubcat("slug")}
										placeholder="zapatillas-casuales"
									/>
								</label>

								<label>
									<span className={styles.labelText}>
										Nombre <span className={styles.requiredMark}>*</span>
									</span>
									<input
										required
										{...subcatNameField}
										onChange={(event) => {
											subcatNameField.onChange(event);
											setSubcatValue("slug", slugify(event.target.value), {
												shouldDirty: true,
											});
										}}
									/>
								</label>

								<label>
									Categoría
									<select {...registerSubcat("category")}>
										{productCategories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
								</label>
							</div>
						</form>
					</aside>
				</>
			)}

			{brandDrawerOpen && (
				<>
					<button
						type="button"
						className={styles.drawerBackdrop}
						onClick={closeBrandDrawer}
						aria-label="Cerrar formulario de marca"
					/>
					<aside
						className={styles.drawer}
						role="dialog"
						aria-modal="true"
						aria-label="Formulario de marca"
					>
						<form className={styles.form} onSubmit={handleBrandSubmit}>
							<div className={styles.topRow}>
								<h2>{selectedBrand ? "Editar marca" : "Crear marca"}</h2>
								<div className={styles.actions}>
									<button
										type="button"
										className={styles.secondaryButton}
										onClick={closeBrandDrawer}
										disabled={brandSubmitting}
									>
										Cerrar
									</button>
									{brandSelectedId && (
										<button
											type="button"
											className={styles.danger}
											onClick={handleDeleteBrand}
											disabled={brandSubmitting}
										>
											Eliminar
										</button>
									)}
									<button type="submit" disabled={brandSubmitting}>
										{brandSubmitting ? "Guardando..." : "Guardar"}
									</button>
								</div>
							</div>

							{brandError && <p className={styles.error}>{brandError}</p>}

							<div className={styles.grid}>
								<label>
									ID
									<input
										value={brandForm.id}
										readOnly
										placeholder="Se genera automáticamente"
									/>
								</label>

								<label>
									Slug
									<input {...registerBrand("slug")} placeholder="nike" />
								</label>

								<label>
									<span className={styles.labelText}>
										Nombre <span className={styles.requiredMark}>*</span>
									</span>
									<input
										required
										{...brandNameField}
										onChange={(event) => {
											brandNameField.onChange(event);
											setBrandValue("slug", slugify(event.target.value), {
												shouldDirty: true,
											});
										}}
									/>
								</label>

								<label>
									Categoría
									<select {...registerBrand("category")}>
										{productCategories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
								</label>
							</div>
						</form>
					</aside>
				</>
			)}
		</main>
	);
}
