import type { Metadata } from "next";

import type { UniverseFilter } from "@/lib/shopify/types";

export interface ShopUniverseLandingContent {
  universe: UniverseFilter;
  href: string;
  label: string;
  shortLabel: string;
  heroTitle: string;
  heroDescription: string;
  seoIntro: string;
  purchaseHighlights: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  theme: {
    heroClassName: string;
    badgeClassName: string;
    accentClassName: string;
    statClassName: string;
    ctaClassName: string;
    subtleCtaClassName: string;
    productCardClassName: string;
    stockAvailableClassName: string;
    stockSoldOutClassName: string;
  };
}

export const SHOP_UNIVERSE_ORDER: UniverseFilter[] = ["animals", "mega", "multiverse"];

export const SHOP_UNIVERSE_LANDING_CONTENT: Record<UniverseFilter, ShopUniverseLandingContent> = {
  animals: {
    universe: "animals",
    href: "/shop/animals",
    label: "Animals",
    shortLabel: "Animals",
    heroTitle: "Compra packs Animals oficiales de DOFLINS",
    heroDescription:
      "Explora el universo Animals con packs oficiales, rarezas verificadas y compra segura en Shopify. Ideal si buscas empezar tu colección con piezas de estilo salvaje y buen precio.",
    seoIntro:
      "Esta landing reúne los packs oficiales Animals para captar búsquedas con intención de compra como figuras coleccionables Animals, packs sorpresa DOFLINS y regalos de colección.",
    purchaseHighlights: [
      "Compra segura con checkout Shopify y pago protegido.",
      "Envíos a todo México con información clara antes de pagar.",
      "Rarezas oficiales para coleccionistas que buscan piezas especiales.",
    ],
    faqs: [
      {
        question: "¿Qué encuentro en la colección Animals?",
        answer: "Packs oficiales con estética de naturaleza, variantes raras y figuras pensadas para ampliar tu colección desde el primer pedido.",
      },
      {
        question: "¿Puedo comprar Animals sin salir del sitio?",
        answer: "Sí. Desde esta landing llegas directo a los packs y el pago se completa en Shopify Checkout con flujo seguro.",
      },
      {
        question: "¿Animals sirve para regalo?",
        answer: "Sí. Es una buena puerta de entrada para quien quiere regalar una figura coleccionable sorpresa con rareza oficial.",
      },
    ],
    theme: {
      heroClassName: "border-[#cdddb4] bg-[linear-gradient(145deg,#fbfdf6,#eef6df)] shadow-[0_18px_40px_rgba(78,111,42,0.15)]",
      badgeClassName: "bg-[#e4f0d0] text-[#2f5b1f] ring-1 ring-[#bdd69a]",
      accentClassName: "text-[#2f5b1f]",
      statClassName: "border-[#d8e5c0] bg-white/80",
      ctaClassName: "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white hover:brightness-110",
      subtleCtaClassName: "border-[#bdd69a] bg-white text-[#2f5b1f] hover:bg-[#f2f8e7]",
      productCardClassName: "border-[#d8e5c0] bg-[linear-gradient(180deg,#ffffff,#f6f9ef)]",
      stockAvailableClassName: "bg-[#ddf0c6] text-[#2f5b1f] ring-1 ring-[#b8d493]",
      stockSoldOutClassName: "bg-[#e6d2d2] text-[#7f3e3e] ring-1 ring-[#d6b7b7]",
    },
  },
  mega: {
    universe: "mega",
    href: "/shop/mega",
    label: "MEGA",
    shortLabel: "Mega",
    heroTitle: "Compra packs MEGA de DOFLINS",
    heroDescription:
      "Descubre el universo MEGA con packs oficiales para coleccionistas que buscan presencia, escala y piezas memorables. Compra directa, segura y lista para enviar en México.",
    seoIntro:
      "Esta landing concentra los packs MEGA para búsquedas con intención comercial como figuras grandes coleccionables, packs sorpresa MEGA y regalos premium DOFLINS.",
    purchaseHighlights: [
      "Packs oficiales con presencia visual fuerte para coleccionistas exigentes.",
      "Checkout seguro y rápido, sin fricción innecesaria antes de pagar.",
      "Ideal para tickets más altos y regalos con efecto wow.",
    ],
    faqs: [
      {
        question: "¿Qué hace diferente al universo MEGA?",
        answer: "MEGA está pensado para coleccionistas que priorizan impacto visual, figuras memorables y piezas que destaquen dentro de una colección.",
      },
      {
        question: "¿Se puede comprar MEGA desde México?",
        answer: "Sí. Los packs están disponibles para compra en línea y el costo final se confirma dentro del checkout seguro.",
      },
      {
        question: "¿MEGA es buena opción para regalo?",
        answer: "Sí. Si quieres regalar algo más premium y llamativo, MEGA suele ser la opción más fuerte dentro del catálogo.",
      },
    ],
    theme: {
      heroClassName: "border-[#e5cf8a] bg-[linear-gradient(145deg,#fffdf5,#fdf2cf)] shadow-[0_18px_40px_rgba(196,124,32,0.17)]",
      badgeClassName: "bg-[#fff0c8] text-[#7a4e14] ring-1 ring-[#e2c36f]",
      accentClassName: "text-[#7a4e14]",
      statClassName: "border-[#e6d39c] bg-white/82",
      ctaClassName: "bg-[linear-gradient(135deg,#c47c20,#e2a034)] text-white hover:brightness-110",
      subtleCtaClassName: "border-[#e2c36f] bg-white text-[#7a4e14] hover:bg-[#fff8e6]",
      productCardClassName: "border-[#e6d39c] bg-[linear-gradient(180deg,#ffffff,#fff6e5)]",
      stockAvailableClassName: "bg-[#fff0c8] text-[#7a4e14] ring-1 ring-[#e2c36f]",
      stockSoldOutClassName: "bg-[#e6d2d2] text-[#7f3e3e] ring-1 ring-[#d6b7b7]",
    },
  },
  multiverse: {
    universe: "multiverse",
    href: "/shop/multiverse",
    label: "Multiverse",
    shortLabel: "Multiverse",
    heroTitle: "Compra packs Multiverse de DOFLINS",
    heroDescription:
      "Explora el universo Multiverse con packs oficiales de estética futurista, variantes intensas y compra segura. Ideal para coleccionistas que buscan piezas diferentes y alto interés visual.",
    seoIntro:
      "Esta landing está orientada a búsquedas de compra como figuras coleccionables futuristas, packs Multiverse y regalos DOFLINS con estética sci-fi.",
    purchaseHighlights: [
      "Variantes visuales fuertes para coleccionistas que quieren algo distinto.",
      "Catálogo claro, páginas indexables y links directos a cada pack.",
      "Flujo de pago seguro para convertir mejor el tráfico orgánico.",
    ],
    faqs: [
      {
        question: "¿Qué tipo de packs hay en Multiverse?",
        answer: "Packs con estética más intensa y futurista, pensados para quienes buscan piezas diferentes dentro del universo DOFLINS.",
      },
      {
        question: "¿Puedo ver cada pack antes de comprar?",
        answer: "Sí. Desde esta landing puedes abrir cada producto, revisar su precio y entrar al flujo de compra segura.",
      },
      {
        question: "¿Multiverse también aplica para regalo?",
        answer: "Sí. Si buscas un regalo con una vibra más sci-fi y diferenciada, Multiverse encaja muy bien.",
      },
    ],
    theme: {
      heroClassName: "border-[#c8d4ff] bg-[linear-gradient(145deg,#f5f7ff,#e8edff)] shadow-[0_18px_40px_rgba(68,96,208,0.14)]",
      badgeClassName: "bg-[#dce5ff] text-[#2840a0] ring-1 ring-[#b8c6f8]",
      accentClassName: "text-[#2840a0]",
      statClassName: "border-[#d6dfff] bg-white/82",
      ctaClassName: "bg-[linear-gradient(135deg,#4460d0,#6d87f1)] text-white hover:brightness-110",
      subtleCtaClassName: "border-[#b8c6f8] bg-white text-[#2840a0] hover:bg-[#f2f5ff]",
      productCardClassName: "border-[#d6dfff] bg-[linear-gradient(180deg,#ffffff,#f4f6ff)]",
      stockAvailableClassName: "bg-[#dbe4ff] text-[#24336c] ring-1 ring-[#b8c6f8]",
      stockSoldOutClassName: "bg-[#e6d2d2] text-[#7f3e3e] ring-1 ring-[#d6b7b7]",
    },
  },
};

export function getShopUniverseLandingContent(universe: UniverseFilter): ShopUniverseLandingContent {
  return SHOP_UNIVERSE_LANDING_CONTENT[universe];
}

export function getShopUniverseLandingMetadata(universe: UniverseFilter): Metadata {
  const content = getShopUniverseLandingContent(universe);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://doflins.dofer.mx";
  const canonical = `${siteUrl}${content.href}`;

  return {
    title: `${content.heroTitle} | DOFLINS`,
    description: content.heroDescription,
    alternates: {
      canonical,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${content.heroTitle} | DOFLINS`,
      description: content.heroDescription,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.heroTitle} | DOFLINS`,
      description: content.heroDescription,
    },
  };
}
