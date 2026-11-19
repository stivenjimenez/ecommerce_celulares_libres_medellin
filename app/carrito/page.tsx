"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";
import { useProducts } from "@/lib/services/products";
import { formatCOP } from "@/lib/utils/format";

import styles from "./page.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
export default function CarritoPage() {
  const items = useCartStore((state) => state.items);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const { data: catalog, error: catalogError } = useProducts();
  const invalidItems = items.filter((item) => {
    const product = catalog?.find((entry) => entry.id === item.productId);
    return (
      !product || product.stock < item.quantity || product.price !== item.price
    );
  });

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const orderLines = items.map(
    (item, index) =>
      `${index + 1}. ${item.name} - Cantidad: ${item.quantity} - Total: ${formatCOP(item.price * item.quantity)}`,
  );
  const whatsappMessage = [
    "Hola, quiero hacer un pedido con estos productos:",
    "",
    ...orderLines,
    "",
    `Total de productos: ${totalItems}`,
    `Subtotal pedido: ${formatCOP(subtotal)}`,
    "",
    "¿Me ayudan por favor a confirmar disponibilidad y el proceso de pago?",
  ].join("\n");
  const whatsappOrderUrl = `https://wa.me/573004569938?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <main className={`${styles.page} ${sora.variable} ${manrope.variable}`}>
      <section className={styles.cart}>
        <div className={styles.cartTop}>
          <h1>Carrito</h1>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className={styles.clearButton}
            >
              Vaciar carrito
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega productos para continuar con tu compra.</p>
            <Link href="/productos" className={styles.primaryButton}>
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.items}>
              {items.map((item) => (
                <article key={item.productId} className={styles.item}>
                  <Link
                    href={`/productos/${item.slug}`}
                    className={styles.itemImage}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="140px"
                      className={styles.image}
                    />
                  </Link>

                  <div className={styles.itemBody}>
                    <Link
                      href={`/productos/${item.slug}`}
                      className={styles.itemName}
                    >
                      {item.name}
                    </Link>
                    <p className={styles.itemPrice}>{formatCOP(item.price)}</p>
                    {catalog && invalidItems.includes(item) && (
                      <p>
                        Las existencias o el precio cambiaron. Ajusta la
                        cantidad o elimina y agrega el producto nuevamente.
                      </p>
                    )}

                    <div className={styles.itemActions}>
                      <div className={styles.qtyBox}>
                        <button
                          type="button"
                          onClick={() =>
                            updateItemQuantity(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          disabled={item.quantity <= 1}
                          aria-label={`Restar una unidad de ${item.name}`}
                        >
                          <Minus />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          disabled={
                            !catalog ||
                            item.quantity >=
                              (catalog.find(
                                (product) => product.id === item.productId,
                              )?.stock ?? 0)
                          }
                          onClick={() =>
                            updateItemQuantity(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          aria-label={`Sumar una unidad de ${item.name}`}
                        >
                          <Plus />
                        </button>
                      </div>

                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name} del carrito`}
                      >
                        <Trash2 />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <strong className={styles.itemTotal}>
                    {formatCOP(item.price * item.quantity)}
                  </strong>
                </article>
              ))}
            </div>

            <aside className={styles.summary}>
              <h2>Resumen</h2>
              <div>
                <span>Productos</span>
                <strong>{totalItems}</strong>
              </div>
              <div>
                <span>Subtotal</span>
                <strong>{formatCOP(subtotal)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>{formatCOP(subtotal)}</strong>
              </div>

              {catalogError && (
                <p>No se pudo verificar el inventario. Inténtalo de nuevo.</p>
              )}
              {catalog && !catalogError && invalidItems.length === 0 ? (
                <Link href="/checkout" className={styles.primaryButton}>
                  Finalizar compra
                </Link>
              ) : (
                <button type="button" className={styles.primaryButton} disabled>
                  Finalizar compra
                </button>
              )}

              <Link
                href={whatsappOrderUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.secondaryButton}
              >
                Consultar carrito por WhatsApp
              </Link>
              <Link href="/productos" className={styles.secondaryButton}>
                Seguir comprando
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
