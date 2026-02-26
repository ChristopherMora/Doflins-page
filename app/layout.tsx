import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/analytics/gtm";
import "./globals.css";

const titleFont = Sora({
  variable: "--font-title",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DOFLINS | Animals + Multiverse",
  description: "Página oficial de colección y rareza para personajes DOFLINS en Animals y Multiverse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${titleFont.variable} ${bodyFont.variable} antialiased`}>
        <GoogleTagManagerNoScript />
        <GoogleTagManager />
        {children}
      </body>
    </html>
  );
}
