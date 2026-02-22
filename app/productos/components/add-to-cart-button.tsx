"use client";

import { useState } from "react";
import { ShoppingBasket } from "lucide-react";

import { type Product } from "@/lib/domain/product";
import { useCartStore } from "@/lib/store/cart-store";

import styles from "../product-detail.module.css";
import { QuantitySelector } from "./quantity-selector";

type Props = {
  product: Product;
};

export function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={styles.addToCartGroup}>
      <QuantitySelector value={quantity} onChange={setQuantity} />
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
