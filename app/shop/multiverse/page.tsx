import { ShopUniverseLanding } from "@/components/shop/shop-universe-landing";
import { fetchShopProducts } from "@/lib/server/shopify-storefront";
import { getShopUniverseLandingMetadata } from "@/lib/shop/shop-universe-landing-content";

export const revalidate = 300;
export const metadata = getShopUniverseLandingMetadata("multiverse");

export default async function ShopMultiversePage(): Promise<React.JSX.Element> {
  const products = await fetchShopProducts("multiverse").catch(() => []);

  return <ShopUniverseLanding universe="multiverse" products={products} />;
}
