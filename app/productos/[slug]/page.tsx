import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { ArrowLeft, Facebook, Instagram, ShieldCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";

import { type Product } from "@/lib/domain/product";
import { loadCatalog } from "@/lib/server/catalog";
import { formatCOP } from "@/lib/utils/format";

import { SearchModal } from "../../components/search-modal";
import { CartLink } from "../../components/cart-link";
import homeStyles from "../../home.module.css";
import detailStyles from "../product-detail.module.css";
import { AddToCartButton } from "../components/add-to-cart-button";
import { ProductGallery } from "../components/product-gallery";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const navLinks = [
  { label: "Tecnología", href: "/productos?categoria=tecnologia" },
  { label: "Ropa", href: "/productos?categoria=ropa" },
  { label: "Bicicletas", href: "/productos?categoria=bicicletas" },
];
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
      <header className={homeStyles.header}>
        <div className={homeStyles.headerInner}>
          <Link href="/" className={homeStyles.brand}>
            <Image
              src="https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png"
              alt="Celulares Libres Medellin"
              width={220}
              height={92}
              className={homeStyles.brandLogo}
              priority
            />
          </Link>

          <nav className={homeStyles.nav}>
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className={homeStyles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={homeStyles.headerRight}>
            <SearchModal />
            <CartLink className={homeStyles.iconButton} />
          </div>
        </div>
      </header>

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

      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerInner}>
          <div className={homeStyles.footerGrid}>
            <div>
              <Link href="/" aria-label="Ir al inicio">
                <Image
                  src="https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png"
                  alt="Celulares Libres Medellin"
                  width={200}
                  height={84}
                />
              </Link>
              <p>
                Celulares Libres Medellin: tecnologia, ropa original y repuestos bike con atencion
                cercana en Medellin.
              </p>
            </div>

            {/*
            <div>
              <h4>Explorar</h4>
              <a href="#">Novedades</a>
              <a href="#">Bestsellers</a>
              <a href="#">Promociones</a>
              <a href="#">Marcas</a>
            </div>

            <div>
              <h4>Ayuda</h4>
              <a href="#">Envíos</a>
              <a href="#">Devoluciones</a>
              <a href="#">Soporte 24/7</a>
              <a href="#">FAQ</a>
            </div>
            */}

            <div>
              <h4>Contacto</h4>
              <a href="mailto:meyox@hotmail.com">meyox@hotmail.com</a>
              <a
                href="https://wa.me/573004569938"
                target="_blank"
                rel="noreferrer"
                aria-label="Escribir por WhatsApp al 3004569938"
              >
                300 456 9938
              </a>
            </div>

            <div>
              <h4>Redes sociales</h4>
              <div className={homeStyles.socialLinks}>
                <a
                  href="https://www.facebook.com/marketplace/profile/678380352/?ref=permalink&mibextid=dXMIcH"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                  className={homeStyles.socialLink}
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="https://www.instagram.com/celulares_libres_medellin_/?hl=en"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className={homeStyles.socialLink}
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className={homeStyles.footerBottom}>
            <p>© 2026 Celulares Libres Medellin. Todos los derechos reservados.</p>
            <div>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
