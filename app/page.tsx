import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { ArrowRight, Facebook, Instagram } from "lucide-react";
import styles from "./home.module.css";
import { SearchModal } from "./components/search-modal";
import { CartLink } from "./components/cart-link";
import { FeaturedProductsGrid } from "./components/featured-products-grid";
import { loadCatalog } from "@/lib/server/catalog";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

const navLinks = [
  { label: "Tecnología", href: "/productos?categoria=tecnologia" },
  { label: "Ropa", href: "/productos?categoria=ropa" },
  { label: "Bicicletas", href: "/productos?categoria=bicicletas" },
];

const categories = [
  {
    title: "Tecnología",
    description: "Celulares, audio y gadgets con garantía y entrega rápida en Medellín.",
    image: "/category_tegnologia.png",
    href: "/productos?categoria=tecnologia",
  },
  {
    title: "Ropa",
    description: "Streetwear original: gorras, hoodies y camisetas para todos los días.",
    image: "/category_ropa.png",
    href: "/productos?categoria=ropa",
  },
  {
    title: "Bicicletas",
    description: "BMX, repuestos y accesorios para armar, mejorar y rodar con confianza.",
    image: "/category_bike.png",
    href: "/productos?categoria=bicicletas",
  },
];

export default async function Home() {
  const products = await loadCatalog();
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Image
              src="https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png"
              alt="Logo Celulares Libres Medellin"
              width={220}
              height={92}
              className={styles.brandLogo}
              priority
            />
          </div>

          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerRight}>
            <SearchModal />
            <CartLink className={styles.iconButton} />
          </div>
        </div>
      </header>

      <section className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Categorías</h2>
            <p>Explora nuestro universo de productos</p>
          </div>
          <Link href="/productos">Ver todas ↗</Link>
        </div>

        <div className={styles.categoriesGrid}>
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className={styles.categoryCard}
              aria-label={`Ir a ${category.title}`}
            >
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(max-width: 900px) 100vw, 33vw"
                className={styles.categoryImage}
              />
              <div className={styles.categoryOverlay}>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className={styles.categoryCta} aria-hidden="true">
                  <ArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className={styles.featuredSection}>
          <h2>Lo más buscado</h2>
          <FeaturedProductsGrid products={featuredProducts} />
        </section>
      )}

      <section className={styles.ctaSection}>
        <h2>¿Aún no decides? Empieza por aquí</h2>
        <p>
          Tenemos todo en un solo lugar. Haz clic y recorre el catálogo completo para encontrar
          justo lo que estás buscando.
        </p>
        <Link href="/productos" className={styles.ctaButton}>
          Quiero ver todo el catálogo
        </Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
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
              <div className={styles.socialLinks}>
                <a
                  href="https://web.facebook.com/profile.php?id=100063552430929"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                  className={styles.socialLink}
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="https://www.instagram.com/celulares_libres_medellin_/?hl=en"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className={styles.socialLink}
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
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
