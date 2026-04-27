import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Buscar productos",
  description:
    "Busca productos disponibles en Celulares Libres Medellin por nombre, categoría, marca o precio.",
  path: "/search",
});

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
