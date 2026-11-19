"use client";

import { useState } from "react";
import { MessageCircle, ShoppingBasket } from "lucide-react";

import { type Product } from "@/lib/domain/product";
import { useCartStore } from "@/lib/store/cart-store";
import { productAvailabilityUrl } from "@/lib/utils/whatsapp";

import styles from "../product-detail.module.css";
import { QuantitySelector } from "./quantity-selector";

type Props = {
  product: Product;
};

export function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  if (product.stock <= 0) {
    return (
      <div className={styles.addToCartGroup}>
        <p className={styles.stockNotice}>Producto sin existencias</p>
        <a
          href={productAvailabilityUrl(product.name, product.slug)}
          className={`${styles.primaryButton} ${styles.primaryActionButton} ${styles.whatsappAction}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle aria-hidden="true" />
          Enviar mensaje al vendedor
        </a>
      </div>
    );
  }

  return (
    <div className={styles.addToCartGroup}>
      <QuantitySelector
        value={quantity}
        onChange={setQuantity}
        max={product.stock}
      />
      <button
        type="button"
        className={`${styles.primaryButton} ${styles.primaryActionButton}`}
        onClick={() => addItem(product, quantity)}
      >
        <ShoppingBasket />
        {quantity > 1 ? `Agregar ${quantity} al carrito` : "Agregar al carrito"}
      </button>
    </div>
  );
}
