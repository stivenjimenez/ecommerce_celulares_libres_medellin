"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";

import styles from "./cart-link.module.css";

type Props = {
  className?: string;
};

function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CartLink({ className }: Props) {
  const totalItems = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0),
  );

  return (
    <Link
      href="/carrito"
      className={joinClassNames(styles.cartLink, className)}
      aria-label={
        totalItems > 0
          ? `Ir al carrito con ${totalItems} productos`
          : "Ir al carrito (vacío)"
      }
    >
      <ShoppingCart />
      {totalItems > 0 && <span className={styles.badge}>{totalItems > 9 ? "9+" : totalItems}</span>}
    </Link>
  );
}
