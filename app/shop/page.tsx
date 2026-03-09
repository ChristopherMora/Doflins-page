import type { Metadata } from "next";

import { BottomNav } from "@/components/nav/bottom-nav";
import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";

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

export default function ShopPage(): React.JSX.Element {
  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-28 sm:px-8 sm:py-5 sm:pb-10">
        <ShopifyBuyExperience />
      </main>
      <BottomNav />
    </>
  );
}
