import type { Metadata } from "next";
import { Toaster } from "sonner";

import { WhatsAppFloat } from "./components/whatsapp-float";
import "./globals.css";

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
      <body>
        {children}
        <WhatsAppFloat />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
