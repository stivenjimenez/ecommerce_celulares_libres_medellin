"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";

import styles from "./whatsapp-float.module.css";

export function WhatsAppFloat() {
  const totalItems = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0),
  );

  return (
    <div className={styles.stack}>
      {totalItems > 0 ? (
        <Link
          href="/carrito"
          aria-label={`Ir al carrito con ${totalItems} productos`}
          className={`${styles.button} ${styles.cartButton}`}
        >
          <ShoppingCart />
          <span className={styles.badge}>{totalItems > 99 ? "99+" : totalItems}</span>
        </Link>
      ) : null}

      <a
        href="https://wa.me/573004569938"
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
        className={`${styles.button} ${styles.whatsButton}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2a9.97 9.97 0 0 0-8.66 14.91L2 22l5.23-1.37A9.96 9.96 0 0 0 12.04 22h.01A9.98 9.98 0 0 0 22 12a9.87 9.87 0 0 0-2.95-7.09Zm-7.01 15.4h-.01a8.3 8.3 0 0 1-4.22-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.3 8.3 0 0 1-1.28-4.43 8.31 8.31 0 0 1 8.29-8.33 8.28 8.28 0 0 1 5.89 2.45A8.22 8.22 0 0 1 20.28 12a8.31 8.31 0 0 1-8.24 8.31Zm4.56-6.2c-.25-.13-1.47-.73-1.69-.81-.23-.08-.39-.13-.56.12s-.64.81-.78.97c-.14.17-.29.19-.54.06a6.8 6.8 0 0 1-2-1.24 7.61 7.61 0 0 1-1.39-1.73c-.14-.25-.01-.39.11-.52.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.02 2.6.12.17 1.77 2.7 4.29 3.79.6.26 1.07.42 1.43.54.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z" />
        </svg>
      </a>
    </div>
  );
}
