import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Carrito",
  description:
    "Revisa los productos de tu carrito y finaliza tu pedido por WhatsApp con Celulares Libres Medellin.",
  path: "/carrito",
  noIndex: true,
});

export default function CarritoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
