"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { usePathname } from "next/navigation";

import homeStyles from "@/app/home.module.css";

import { CartLink } from "./cart-link";
import { SearchModal } from "./search-modal";

const navLinks = [
  { label: "Tecnología", href: "/productos?categoria=tecnologia" },
  { label: "Ropa", href: "/productos?categoria=ropa" },
  { label: "Bicicletas", href: "/productos?categoria=bicicletas" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <header className={homeStyles.header}>
        <div className={homeStyles.headerInner}>
          <Link href="/" className={homeStyles.brand}>
            <Image
              src="https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png"
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

      {children}

      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerInner}>
          <div className={homeStyles.footerGrid}>
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
                  href="https://www.facebook.com/marketplace/profile/678380352/?ref=permalink&mibextid=dXMIcH"
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
    </>
  );
}
