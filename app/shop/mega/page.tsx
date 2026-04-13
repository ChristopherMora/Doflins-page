import { ShopUniverseLanding } from "@/components/shop/shop-universe-landing";
import { fetchShopProducts } from "@/lib/server/shopify-storefront";
import { getShopUniverseLandingMetadata } from "@/lib/shop/shop-universe-landing-content";

export const revalidate = 300;
export const metadata = getShopUniverseLandingMetadata("mega");

export default async function ShopMegaPage(): Promise<React.JSX.Element> {
  const products = await fetchShopProducts("mega").catch(() => []);

  return <ShopUniverseLanding universe="mega" products={products} />;
}
