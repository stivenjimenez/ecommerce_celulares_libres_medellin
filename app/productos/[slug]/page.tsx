import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";

import { type Product } from "@/lib/domain/product";
import { loadCatalog } from "@/lib/server/catalog";
import { formatCOP } from "@/lib/utils/format";

import detailStyles from "../product-detail.module.css";
import { AddToCartButton } from "../components/add-to-cart-button";
import { ProductGallery } from "../components/product-gallery";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const categoryLabel = {
  technology: "Tecnología",
  clothing: "Ropa",
  shoes: "Calzado",
  bikes: "Bicicletas",
};

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

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const products = await loadCatalog();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const description = normalizeDescription(product);

  return (
    <main className={`${detailStyles.page} ${sora.variable} ${manrope.variable}`}>
      <section className={detailStyles.detail}>
        <Link href="/productos" className={detailStyles.backLink}>
          <ArrowLeft /> Volver al catálogo
        </Link>

        <div className={detailStyles.grid}>
          <div className={detailStyles.imagePanel}>
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          <article className={detailStyles.infoPanel}>
            <p className={detailStyles.category}>{categoryLabel[product.category]}</p>
            <h1>{product.name}</h1>
            <div className={detailStyles.priceWrap}>
              {typeof product.previousPrice === "number" && product.previousPrice > product.price ? (
                <p className={detailStyles.previousPrice}>{formatCOP(product.previousPrice)}</p>
              ) : null}
              <p className={detailStyles.price}>{formatCOP(product.price)}</p>
            </div>
            {description ? <p className={detailStyles.description}>{description}</p> : null}

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
