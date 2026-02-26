import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import styles from "./home.module.css";
import { FeaturedProductsGrid } from "./components/featured-products-grid";
import { loadCatalog } from "@/lib/server/catalog";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

const categories = [
  {
    title: "Tecnología",
    description: "Celulares, audio y gadgets.",
    image: "/category_tegnologia.png",
    href: "/productos?categoria=tecnologia",
  },
  {
    title: "Ropa",
    description: "Prendas urbanas y accesorios.",
    image: "/category_ropa.png",
    href: "/productos?categoria=ropa",
  },
  {
    title: "Bicicletas",
    description: "Bicis, repuestos y accesorios.",
    image: "/category_bike.png",
    href: "/productos?categoria=bicicletas",
  },
];

export default async function Home() {
  const products = await loadCatalog();
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <section className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <Link href="/productos">
            Ver todos los productos <ArrowUpRight />
          </Link>
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
    </main>
  );
}
