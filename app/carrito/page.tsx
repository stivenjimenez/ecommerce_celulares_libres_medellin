"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";
import { Facebook, Instagram, Minus, Plus, Trash2 } from "lucide-react";

import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";

import { CartLink } from "../components/cart-link";
import { SearchModal } from "../components/search-modal";
import homeStyles from "../home.module.css";
import styles from "./page.module.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
const navLinks = [
  { label: "Tecnología", href: "/productos?categoria=tecnologia" },
  { label: "Ropa", href: "/productos?categoria=ropa" },
  { label: "Bicicletas", href: "/productos?categoria=bicicletas" },
];

export default function CarritoPage() {
  const items = useCartStore((state) => state.items);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
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

      <section className={styles.cart}>
        <div className={styles.cartTop}>
          <h1>Carrito</h1>
          {items.length > 0 && (
            <button type="button" onClick={clearCart} className={styles.clearButton}>
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
                  <Link href={`/productos/${item.slug}`} className={styles.itemImage}>
                    <Image src={item.image} alt={item.name} fill sizes="140px" className={styles.image} />
                  </Link>

                  <div className={styles.itemBody}>
                    <Link href={`/productos/${item.slug}`} className={styles.itemName}>
                      {item.name}
                    </Link>
                    <p className={styles.itemPrice}>{formatCOP(item.price)}</p>

                    <div className={styles.itemActions}>
                      <div className={styles.qtyBox}>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Restar una unidad de ${item.name}`}
                        >
                          <Minus />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
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

                  <strong className={styles.itemTotal}>{formatCOP(item.price * item.quantity)}</strong>
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

              <Link
                href={whatsappOrderUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.primaryButton}
              >
                Finalizar por WhatsApp
              </Link>
              <Link href="/productos" className={styles.secondaryButton}>
                Seguir comprando
              </Link>
            </aside>
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
