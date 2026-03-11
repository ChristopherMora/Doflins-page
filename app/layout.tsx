import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/analytics/gtm";
import { SiteFooter } from "@/components/nav/site-footer";
import { SiteHeader } from "@/components/nav/site-header";
import { BackToTop } from "@/components/ui/back-to-top";
import { PwaInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { ReferralBanner } from "@/components/ui/referral-banner";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const titleFont = Sora({
  variable: "--font-title",
  subsets: ["latin"],
  display: "optional", // evita FOUT (sin re-layout si la fuente llega tarde)
  weight: ["600", "700", "800"],
  preload: true,
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "optional",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
});

const siteUrl = 'https://doflins.dofer.mx';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DOFLINS | Colección Oficial Animals + Multiverse",
    template: "%s | DOFLINS",
  },
  description: "Colecciona figuras DOFLINS con rareza oficial. Explora los universos Animals y Multiverse, completa tu colección y descubre personajes únicos con sistema de rareza verificado.",
  keywords: [
    "doflins",
    "colección",
    "figuras",
    "animals",
    "multiverse",
    "rareza",
    "coleccionables",
    "catálogo oficial",
    "México",
    "toys",
    "collectibles",
  ],
  authors: [{ name: "DOFLINS" }],
  creator: "DOFLINS",
  publisher: "DOFLINS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: siteUrl,
    siteName: "DOFLINS",
    title: "DOFLINS | Colección Oficial Animals + Multiverse",
    description: "Colecciona figuras DOFLINS con rareza oficial. Explora Animals y Multiverse, completa tu colección y descubre personajes únicos.",
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`, // Crea esta imagen 1200x630
        width: 1200,
        height: 630,
        alt: "DOFLINS - Colección oficial Animals + Multiverse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DOFLINS | Colección Oficial Animals + Multiverse",
    description: "Colecciona figuras DOFLINS con rareza oficial. Explora Animals y Multiverse.",
    images: [`${siteUrl}/images/og-image.jpg`], // Misma imagen
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // google: 'tu-codigo-aqui', // Agrega después de verificar en Google Search Console
  },
  category: "toys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data para SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DOFLINS",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: "Colección oficial de figuras DOFLINS con rareza verificada. Creado por DOFER.",
    sameAs: [
      "https://www.instagram.com/doferworkshop/",
      "https://www.facebook.com/profile.php?id=61554032801394",
      "https://www.tiktok.com/@dofershop",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DOFLINS",
    url: siteUrl,
    description: "Colecciona figuras DOFLINS con rareza oficial. Explora los universos Animals y Multiverse.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/reveal?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-flash: restore theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('doflins_theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();`,
          }}
        />
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${titleFont.variable} ${bodyFont.variable} antialiased`}>
        <GoogleTagManagerNoScript />
        <GoogleTagManager />
        <SiteHeader />
        {children}
        <SiteFooter />
        <BackToTop />
        <PwaInstallPrompt />
        <ReferralBanner />
        <Toaster />
      </body>
    </html>
  );
}
