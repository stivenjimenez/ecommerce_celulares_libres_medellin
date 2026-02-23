"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { Facebook, Instagram, ShoppingCart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { type ProductCategory } from "@/lib/domain/product";
import { useProducts } from "@/lib/services/products";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import homeStyles from "../home.module.css";
import { CartLink } from "../components/cart-link";
import { SearchModal } from "../components/search-modal";
import styles from "./productos.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const navLinks = [
  { label: "Tecnología", href: "/productos?categoria=tecnologia" },
  { label: "Ropa", href: "/productos?categoria=ropa" },
  { label: "Bicicletas", href: "/productos?categoria=bicicletas" },
];

const categoryFilters: Record<string, ProductCategory[]> = {
  tecnologia: ["technology"],
  ropa: ["clothing", "shoes"],
  bicicletas: ["bikes"],
};

const categoryTitles: Record<string, string> = {
  tecnologia: "Tecnología",
  ropa: "Ropa",
  bicicletas: "Bicicletas",
};

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function ProductosPageContent() {
  const { data: products = [], isLoading, error } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("categoria")?.toLowerCase() ?? "";
  const activeCategories = categoryFilters[categoryParam] ?? null;
  const sectionTitle = categoryTitles[categoryParam] ?? "Catálogo completo";

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !activeCategories || activeCategories.includes(product.category);
      return matchesCategory;
    });
  }, [activeCategories, products]);

  const groupedSections = useMemo(() => {
    if (activeCategories) return [];

    const keys = ["tecnologia", "ropa", "bicicletas"] as const;
    return keys
      .map((key) => ({
        key,
        title: categoryTitles[key],
        products: filteredProducts.filter((product) => categoryFilters[key].includes(product.category)),
      }))
      .filter((section) => section.products.length > 0);
  }, [activeCategories, filteredProducts]);

  function renderProductCard(product: (typeof filteredProducts)[number]) {
    const image = product.images[0] ?? "/brand/clm-logo.png";

    return (
      <article
        key={product.id}
        className={styles.card}
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
        <div className={styles.imageWrap}>
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
            className={styles.image}
          />
        </div>

        <div className={styles.cardBody}>
          <h2>{product.name}</h2>
          <p>{truncate(product.description, 64)}</p>
          <div className={styles.cardBottom}>
            <strong>{formatCOP(product.price)}</strong>
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

  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <header className={homeStyles.header}>
        <div className={homeStyles.headerInner}>
          <Link href="/" className={homeStyles.brand}>
            <Image
              src="/brand/clm-logo.png"
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

      <section className={styles.catalog}>
        <div className={styles.catalogTop}>
          <h1>{sectionTitle.toUpperCase()}</h1>
        </div>

        {error && <p className={styles.state}>No se pudieron cargar los productos.</p>}
        {isLoading && <p className={styles.state}>Cargando catálogo...</p>}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <p className={styles.state}>No hay productos disponibles en esta categoría.</p>
        )}

        {!error && filteredProducts.length > 0 && activeCategories && (
          <div className={styles.grid}>{filteredProducts.map(renderProductCard)}</div>
        )}

        {!error && filteredProducts.length > 0 && !activeCategories && (
          <div className={styles.categorySections}>
            {groupedSections.map((section) => (
              <div key={section.key} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>{section.title}</h2>
                <div className={styles.grid}>{section.products.map(renderProductCard)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerInner}>
          <div className={homeStyles.footerGrid}>
            <div>
              <Link href="/" aria-label="Ir al inicio">
                <Image
                  src="/brand/clm-logo.png"
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
                  href="https://web.facebook.com/profile.php?id=100063552430929"
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

export default function ProductosPage() {
  return (
    <Suspense fallback={<main className={`${styles.page} ${sora.variable} ${manrope.variable}`} />}>
      <ProductosPageContent />
    </Suspense>
  );
}
