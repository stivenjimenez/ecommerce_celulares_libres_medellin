import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Productos",
  description:
    "Explora celulares libres, ropa original, accesorios bike y tecnología disponible en Celulares Libres Medellin.",
  path: "/productos",
});

export default function ProductosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
