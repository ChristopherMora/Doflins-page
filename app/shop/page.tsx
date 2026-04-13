import type { Metadata } from "next";

import { BottomNav } from "@/components/nav/bottom-nav";
import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";
import { fetchShopProducts } from "@/lib/server/shopify-storefront";
import type { ShopProduct } from "@/lib/shopify/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tienda | DOFLINS",
  description:
    "Compra packs oficiales DOFLINS y descubre qué figuras te tocan. Envíos a todo México.",
  openGraph: {
    title: "Tienda DOFLINS",
    description:
      "Packs de figuras coleccionables con rareza verificada. Animals y Multiverse. Envíos a todo México.",
  },
  robots: { index: true },
};

const SITE_URL = "https://doflins.dofer.mx";

function buildProductSchemaList(products: ShopProduct[]) {
  const items = products
    .filter((p) => p.title && p.price?.amount)
    .map((product, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      item: {
        "@type": "Product" as const,
        name: product.title,
        description: product.shortDescription || product.description,
        ...(product.imageUrl ? { image: product.imageUrl } : {}),
        url: `${SITE_URL}/shop`,
        brand: { "@type": "Brand" as const, name: "DOFLINS" },
        category: "Collectible Toy",
        offers: {
          "@type": "Offer" as const,
          url: `${SITE_URL}/shop`,
          priceCurrency: product.price.currencyCode || "MXN",
          price: product.price.amount,
          availability: product.availableForSale
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization" as const, name: "DOFLINS" },
        },
      },
    }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tienda DOFLINS — Packs de figuras coleccionables",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: items.length,
    itemListElement: items,
  };
}

export default async function ShopPage(): Promise<React.JSX.Element> {
  let initialProducts: ShopProduct[] | undefined;
  try {
    initialProducts = await fetchShopProducts("animals");
  } catch {
    // Silently fall through — client will retry via useEffect
  }

  // Fetch all universes in parallel for complete Schema.org coverage
  let allProducts: ShopProduct[] = initialProducts ?? [];
  try {
    const [multiverse, mega] = await Promise.all([
      fetchShopProducts("multiverse").catch(() => []),
      fetchShopProducts("mega").catch(() => []),
    ]);
    allProducts = [...allProducts, ...multiverse, ...mega];
  } catch {
    // Use whatever we have
  }

  const jsonLd = allProducts.length > 0 ? buildProductSchemaList(allProducts) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-28 sm:px-8 sm:py-5 sm:pb-10">
        <ShopifyBuyExperience initialProducts={initialProducts} />
      </main>
      <BottomNav />
    </>
  );
}
