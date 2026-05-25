import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bike,
  Home,
  MessageCircle,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";

import styles from "./links.module.css";
import { FacebookIcon, InstagramIcon } from "@/app/components/social-icons";
import { createPageMetadata } from "@/lib/site-metadata";

const whatsappUrl =
  "https://wa.me/573004569938?text=Hola%2C%20vengo%20desde%20el%20QR%20de%20Celulares%20Libres%20Medellin%20y%20quiero%20mas%20informacion.";

const links = [
  {
    label: "WhatsApp",
    description: "Cotiza, separa o pregunta por disponibilidad.",
    href: whatsappUrl,
    icon: MessageCircle,
    tone: "whatsapp",
    external: true,
  },
  {
    label: "Instagram",
    description: "Novedades, historias y productos recientes.",
    href: "https://www.instagram.com/celulares_libres_medellin_/?hl=en",
    icon: InstagramIcon,
    tone: "instagram",
    external: true,
  },
  {
    label: "Facebook Marketplace",
    description: "Publicaciones activas y ofertas del momento.",
    href: "https://www.facebook.com/marketplace/profile/678380352/?ref=permalink&mibextid=dXMIcH",
    icon: FacebookIcon,
    tone: "facebook",
    external: true,
  },
  {
    label: "Ir a la tienda",
    description: "Entra al home de Celulares Libres Medellin.",
    href: "/",
    icon: Home,
    tone: "store",
  },
  {
    label: "Ver todos los productos",
    description: "Explora celulares, ropa, tecnologia y bike.",
    href: "/productos",
    icon: ShoppingBag,
    tone: "catalog",
  },
];

const quickLinks = [
  {
    label: "Tecnologia",
    href: "/productos?categoria=tecnologia",
    icon: Smartphone,
  },
  { label: "Ropa", href: "/productos?categoria=ropa", icon: Shirt },
  { label: "Bicicletas", href: "/productos?categoria=bicicletas", icon: Bike },
];

export const metadata = createPageMetadata({
  title: "Links",
  description:
    "Links oficiales de Celulares Libres Medellin: WhatsApp, Instagram, Facebook y tienda online.",
  path: "/links",
});

export default function LinksPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="links-title">
        <div className={styles.glow} aria-hidden="true" />

        <div className={styles.brandBlock}>
          <div className={styles.logoWrap}>
            <Image
              src="/clm-logo_fyqsex.png"
              alt="Celulares Libres Medellin"
              width={220}
              height={92}
              priority
              className={styles.logo}
            />
          </div>
          <span className={styles.badge}>
            <Sparkles aria-hidden="true" /> Links oficiales
          </span>
          <h1 id="links-title">Todo en un solo toque</h1>
          <p>
            Celulares libres, tecnologia, ropa original y accesorios bike en
            Medellin.
          </p>
        </div>

        <div className={styles.linksList}>
          {links.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className={`${styles.iconBox} ${styles[item.tone]}`}>
                  <Icon aria-hidden="true" />
                </span>
                <span className={styles.linkText}>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <ArrowUpRight className={styles.arrow} aria-hidden="true" />
              </>
            );

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkCard}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={styles.linkCard}
              >
                {content}
              </Link>
            );
          })}
        </div>

        <div className={styles.quickGrid} aria-label="Categorias rapidas">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={styles.quickLink}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <p className={styles.footerNote}>Escanea, escribe y compra facil.</p>
      </section>
    </main>
  );
}
