"use client";

import { type Product } from "@/lib/domain/product";

import { ProductCard } from "./product-card";
import styles from "./featured-products-grid.module.css";

export function FeaturedProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
