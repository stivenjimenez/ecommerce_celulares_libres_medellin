import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { ShieldCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";

import { type Product } from "@/lib/domain/product";
import { loadCatalog } from "@/lib/server/catalog";
import { formatCOP } from "@/lib/utils/format";

import detailStyles from "../product-detail.module.css";
import { AddToCartButton } from "../components/add-to-cart-button";
import { ProductGallery } from "../components/product-gallery";
import { BackButton } from "./back-button";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const categoryLabel = {
  technology: "Tecnología",
  clothing: "Ropa",
  bikes: "Bicicletas",
  sincategoria: "",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://celulareslibresmedellin.co";
const fallbackSocialImage = new URL("/og-whatsapp.png", siteUrl).toString();

type Props = {
  params: Promise<{ slug: string }>;
};

function normalizeDescription(product: Product) {
  const description = product.description.trim();

  if (!description || description.toLowerCase().startsWith("imported from")) {
    return "";
  }

  if (/^\((.+)\)$/.test(description)) {
    return "";
  }

  return description;
}

function getAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedValue = value.startsWith("/") ? value : `/${value}`;
  return new URL(normalizedValue, siteUrl).toString();
}

function buildProductDescription(product: Product) {
  const priceLabel = formatCOP(product.price);
  const description = normalizeDescription(product);

  if (description) {
    return `${priceLabel} · ${description}`;
  }

  return `${priceLabel} · Disponible en Celulares Libres Medellin.`;
}

async function getProductBySlug(slug: string) {
  const products = await loadCatalog();
  return products.find((item) => item.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  const productUrl = new URL(`/productos/${product.slug}`, siteUrl).toString();
  const socialImage = product.images[0]
    ? getAbsoluteUrl(product.images[0])
    : fallbackSocialImage;
  const description = buildProductDescription(product);

  return {
    title: product.name,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: "website",
      locale: "es_CO",
      url: productUrl,
      title: product.name,
      description,
      images: [
        {
          url: socialImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [socialImage],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const description = normalizeDescription(product);

  return (
    <main
      className={`${detailStyles.page} ${sora.variable} ${manrope.variable}`}
    >
      <section className={detailStyles.detail}>
        <BackButton className={detailStyles.backLink} />

        <div className={detailStyles.grid}>
          <div className={detailStyles.imagePanel}>
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          <article className={detailStyles.infoPanel}>
            <p className={detailStyles.category}>
              {categoryLabel[product.category]}
            </p>
            <h1>{product.name}</h1>
            <div className={detailStyles.priceWrap}>
              {typeof product.previousPrice === "number" &&
              product.previousPrice > product.price ? (
                <p className={detailStyles.previousPrice}>
                  {formatCOP(product.previousPrice)}
                </p>
              ) : null}
              <p className={detailStyles.price}>{formatCOP(product.price)}</p>
            </div>
            {description ? (
              <p className={detailStyles.description}>{description}</p>
            ) : null}

            <div className={detailStyles.actions}>
              <AddToCartButton product={product} />
              <Link href="/productos" className={detailStyles.secondaryButton}>
                Seguir comprando
              </Link>
            </div>

            <div className={detailStyles.benefits}>
              <div>
                <Truck />
                <span>Envío rápido a todo Colombia</span>
              </div>
              <div>
                <ShieldCheck />
                <span>Garantía de calidad en todos los productos</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
