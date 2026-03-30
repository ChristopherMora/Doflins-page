import type { NextConfig } from "next";

// Dominios de Shopify CDN permitidos para imágenes
const shopifyImgHosts = [
  "cdn.shopify.com",
  "*.myshopify.com",
  "*.cdn.shopify.com",
];

const nextConfig: NextConfig = {
  output: "standalone",
  // No exponer que el servidor es Next.js
  poweredByHeader: false,

  // Optimización de imágenes — restringida a dominios conocidos
  images: {
    remotePatterns: [
      // Shopify CDN (imágenes de productos)
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "*.myshopify.com" },
      { protocol: "https", hostname: "*.cdn.shopify.com" },
      // Supabase Storage (uploads de doflins)
      { protocol: "https", hostname: "*.supabase.co" },
      // QR code service (solo para el QR del carrito)
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    // CSP pragmático: permite GTM/Google Analytics y Shopify Checkout
    // unsafe-inline en script-src es necesario por GTM; unsafe-inline en style-src por Tailwind CSS vars
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://checkout.shopify.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: blob: ${shopifyImgHosts.join(" ")} https://*.supabase.co https://api.qrserver.com https://www.google-analytics.com https://www.googletagmanager.com`,
      `connect-src 'self' https://*.supabase.co https://*.myshopify.com https://www.google-analytics.com https://www.googletagmanager.com`,
      `frame-src https://checkout.shopify.com https://www.googletagmanager.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=(self)",
              "usb=()",
              "interest-cohort=()",
            ].join(", "),
          },
        ],
      },
    ];
  },

  compress: true,

  experimental: {
    optimizePackageImports: ["@heroicons/react"],
  },
};

export default nextConfig;
