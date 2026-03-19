import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { Toaster } from "sonner";

import { SiteChrome } from "./components/site-chrome";
import { WhatsAppFloat } from "./components/whatsapp-float";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://celulareslibresmedellin.com";

const siteTitle = "Celulares Libres Medellin | Celulares Libres";
const siteDescription =
  "En celulares libres medellin encuentras celulares libres, ropa original y lo último en tecnología.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Celulares Libres Medellin",
  },
  description: siteDescription,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "Celulares Libres Medellin",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${sora.variable} ${manrope.variable}`}>
        <SiteChrome>{children}</SiteChrome>
        <WhatsAppFloat />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
