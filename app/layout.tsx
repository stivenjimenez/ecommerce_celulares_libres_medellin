import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { Toaster } from "sonner";

import { SiteChrome } from "./components/site-chrome";
import { WhatsAppFloat } from "./components/whatsapp-float";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Celulares Libres Medellin",
  description: "Cascaron base del proyecto",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
