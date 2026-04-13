import type { ShopProduct, ShopProductVariant, UniverseFilter } from "@/lib/shopify/types";
import { getSiteUrl } from "@/lib/shop/shop-structured-data";
import { SHOP_UNIVERSE_ORDER } from "@/lib/shop/shop-universe-landing-content";
import { fetchShopProducts } from "@/lib/server/shopify-storefront";

export const runtime = "nodejs";
export const revalidate = 45;

const BRAND_NAME = "DOFLINS";
const DEFAULT_CURRENCY = "MXN";
const GOOGLE_PRODUCT_CATEGORY_ID = "1253";

function pickFeedVariant(product: ShopProduct): ShopProductVariant | null {
  return product.variants.find((variant) => variant.availableForSale) ?? product.variants[0] ?? null;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function normalizeText(value: string): string {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatFeedPrice(amount: string | undefined, currencyCode: string | undefined): string | null {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return null;
  }

  return `${numericAmount.toFixed(2)} ${currencyCode || DEFAULT_CURRENCY}`;
}

function merchantAvailability(product: ShopProduct, variant: ShopProductVariant | null): string {
  return variant?.availableForSale ?? product.availableForSale ? "in_stock" : "out_of_stock";
}

function universeLabel(universe: UniverseFilter | null): string {
  if (universe === "multiverse") return "Multiverse";
  if (universe === "mega") return "MEGA";
  return "Animals";
}

function merchantProductType(product: ShopProduct): string {
  return `Juguetes y juegos > Figuras coleccionables > DOFLINS > ${universeLabel(product.universe)}`;
}

function merchantDescription(product: ShopProduct): string {
  const baseDescription = normalizeText(product.description) || normalizeText(product.shortDescription);
  const description =
    baseDescription || `Pack oficial DOFLINS ${product.title}. Compra segura con envío a todo México.`;
  return truncateText(description, 5000);
}

function buildFeedItem(product: ShopProduct, siteUrl: string): string | null {
  const variant = pickFeedVariant(product);
  const price = formatFeedPrice((variant?.price ?? product.price).amount, (variant?.price ?? product.price).currencyCode);

  if (!product.handle || !product.title || !product.imageUrl || !price) {
    return null;
  }

  const productUrl = `${siteUrl}/shop/${product.handle}`;

  return [
    "    <item>",
    `      <g:id>${escapeXml(product.handle.slice(0, 50))}</g:id>`,
    `      <g:title>${escapeXml(truncateText(normalizeText(product.title), 150))}</g:title>`,
    `      <g:description>${escapeXml(merchantDescription(product))}</g:description>`,
    `      <g:link>${escapeXml(productUrl)}</g:link>`,
    `      <g:image_link>${escapeXml(product.imageUrl)}</g:image_link>`,
    "      <g:condition>new</g:condition>",
    `      <g:availability>${merchantAvailability(product, variant)}</g:availability>`,
    `      <g:price>${escapeXml(price)}</g:price>`,
    `      <g:brand>${BRAND_NAME}</g:brand>`,
    "      <g:identifier_exists>no</g:identifier_exists>",
    `      <g:google_product_category>${GOOGLE_PRODUCT_CATEGORY_ID}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(merchantProductType(product))}</g:product_type>`,
    `      <g:custom_label_0>${escapeXml(product.universe ?? "animals")}</g:custom_label_0>`,
    "    </item>",
  ].join("\n");
}

async function fetchMerchantProducts(): Promise<ShopProduct[]> {
  const productsByUniverse = await Promise.all(
    SHOP_UNIVERSE_ORDER.map((universe) => fetchShopProducts(universe).catch(() => [])),
  );

  const dedupedProducts = new Map<string, ShopProduct>();

  for (const products of productsByUniverse) {
    for (const product of products) {
      if (!product.handle || dedupedProducts.has(product.handle)) continue;
      dedupedProducts.set(product.handle, product);
    }
  }

  return Array.from(dedupedProducts.values()).sort((left, right) => left.title.localeCompare(right.title, "es-MX"));
}

export async function GET(): Promise<Response> {
  const siteUrl = getSiteUrl();
  const products = await fetchMerchantProducts();
  const items = products
    .map((product) => buildFeedItem(product, siteUrl))
    .filter((item): item is string => item !== null)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>DOFLINS Merchant Center Feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Feed principal de productos DOFLINS para Google Merchant Center y free listings en México.</description>
    <language>es-mx</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=900, stale-while-revalidate=86400",
    },
  });
}
