import type { ShopProduct, ShopProductVariant } from "@/lib/shopify/types";

const DEFAULT_SITE_URL = "https://doflins.dofer.mx";
const DEFAULT_CONTACT_EMAIL = "contacto@doflins.com";
const DEFAULT_FREE_SHIPPING_THRESHOLD = 450;
const BUSINESS_DAYS = [
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
] as const;

function normalizeSiteUrl(rawValue: string | undefined): string {
  return (rawValue?.trim() || DEFAULT_SITE_URL).replace(/\/$/, "");
}

function parseMoneyAmount(amount: string | undefined): number | null {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return null;
  }

  return Number(numericAmount.toFixed(2));
}

function getContactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;
}

function getFreeShippingThreshold(): number | null {
  const rawValue = Number(process.env.NEXT_PUBLIC_FREE_GIFT_MIN_SUBTOTAL ?? DEFAULT_FREE_SHIPPING_THRESHOLD);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null;
}

function buildProductDescription(product: ShopProduct): string {
  const description = product.description.trim() || product.shortDescription.trim();
  return description || `Pack oficial DOFLINS ${product.title}.`;
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildStoreOrganizationSchema(currencyCode = "MXN") {
  const siteUrl = getSiteUrl();
  const freeShippingThreshold = getFreeShippingThreshold();
  const shippingDescription = freeShippingThreshold
    ? `Envíos a toda la República Mexicana con preparación de 1 a 2 días hábiles, entrega estimada de 3 a 7 días hábiles, costo calculado en checkout y envío gratis en compras mayores a ${freeShippingThreshold} ${currencyCode}.`
    : "Envíos a toda la República Mexicana con preparación de 1 a 2 días hábiles, entrega estimada de 3 a 7 días hábiles y costo calculado en checkout.";

  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${siteUrl}#organization`,
    name: "DOFLINS",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: "Colección oficial de figuras DOFLINS con rareza verificada. Creado por DOFER.",
    email: getContactEmail(),
    sameAs: [
      "https://www.instagram.com/doferworkshop/",
      "https://www.facebook.com/profile.php?id=61554032801394",
      "https://www.tiktok.com/@dofershop",
    ],
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      "@id": `${siteUrl}/devoluciones#policy`,
      applicableCountry: "MX",
      merchantReturnLink: `${siteUrl}/devoluciones`,
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      customerRemorseReturnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      itemDefectReturnFees: "https://schema.org/FreeReturn",
      refundType: "https://schema.org/FullRefund",
      itemCondition: [
        "https://schema.org/NewCondition",
        "https://schema.org/DamagedCondition",
      ],
    },
    hasShippingService: {
      "@type": "ShippingService",
      "@id": `${siteUrl}/envios#standard-shipping`,
      name: "Envío estándar en México",
      description: shippingDescription,
      fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
      handlingTime: {
        "@type": "ServicePeriod",
        businessDays: BUSINESS_DAYS,
        duration: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 2,
          unitCode: "DAY",
        },
      },
      shippingConditions: [
        {
          "@type": "ShippingConditions",
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "MX",
          },
          transitTime: {
            "@type": "ServicePeriod",
            businessDays: BUSINESS_DAYS,
            duration: {
              "@type": "QuantitativeValue",
              minValue: 3,
              maxValue: 7,
              unitCode: "DAY",
            },
          },
        },
      ],
    },
  };
}

export function buildProductStructuredData(
  product: ShopProduct,
  variant: ShopProductVariant | null,
): Record<string, unknown> | null {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/shop/${product.handle}`;
  const activeVariant = variant ?? product.variants[0] ?? null;
  const activePrice = activeVariant?.price ?? product.price;
  const priceValue = parseMoneyAmount(activePrice.amount);

  if (priceValue === null) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    description: buildProductDescription(product),
    url: productUrl,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
    brand: {
      "@type": "Brand",
      name: "DOFLINS",
    },
    category: product.productType || "Collectible Toy",
    offers: {
      "@type": "Offer",
      "@id": `${productUrl}#offer`,
      url: productUrl,
      price: priceValue,
      priceCurrency: activePrice.currencyCode || "MXN",
      availability:
        (activeVariant?.availableForSale ?? product.availableForSale)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@id": `${siteUrl}#organization`,
      },
      hasMerchantReturnPolicy: {
        "@id": `${siteUrl}/devoluciones#policy`,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        hasShippingService: {
          "@id": `${siteUrl}/envios#standard-shipping`,
        },
      },
    },
  };
}

export function buildProductBreadcrumbStructuredData(options: {
  productHandle: string;
  productTitle: string;
  universeName: string;
  universePath: string;
}) {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/shop/${options.productHandle}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tienda",
        item: `${siteUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: options.universeName,
        item: `${siteUrl}${options.universePath}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: options.productTitle,
        item: productUrl,
      },
    ],
  };
}
