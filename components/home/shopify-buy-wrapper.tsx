"use client";

import dynamic from "next/dynamic";

const ShopifyBuyExperience = dynamic(
  () => import("@/components/shop/shopify-buy-experience").then((m) => m.ShopifyBuyExperience),
  { ssr: false }
);

export function ShopifyBuyExperienceWrapper() {
  return <ShopifyBuyExperience />;
}
