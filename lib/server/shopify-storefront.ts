import type { ShopCart, ShopCartLine, ShopProduct, ShopProductVariant, ShopifyMoney, UniverseFilter } from "@/lib/shopify/types";

interface ShopifyConfig {
  domain: string;
  storefrontToken: string;
  apiVersion: string;
}

interface GraphQLErrorShape {
  message?: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorShape[];
}

interface ShopifyImageNode {
  url: string;
  altText: string | null;
}

interface ShopifyProductVariantNode {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: ShopifyMoney;
}

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  productType: string;
  tags: string[];
  featuredImage: ShopifyImageNode | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
  variants: {
    nodes: ShopifyProductVariantNode[];
  };
}

interface ShopifyCartNode {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
  };
  discountCodes: Array<{
    code: string;
    applicable: boolean;
  }>;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        cost: {
          amountPerQuantity: ShopifyMoney;
          totalAmount: ShopifyMoney;
        };
        merchandise: {
          id: string;
          title: string;
          availableForSale: boolean;
          image: ShopifyImageNode | null;
          product: {
            title: string;
            handle: string;
          };
        };
      };
    }>;
  };
}

const DEFAULT_SHOPIFY_API_VERSION = "2025-01";
const MAX_PRODUCTS_PER_QUERY = 30;
const MAX_STOREFRONT_ATTEMPTS = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFetchErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const directCode = "code" in error && typeof error.code === "string" ? error.code : null;
  if (directCode) {
    return directCode;
  }

  const cause = "cause" in error ? error.cause : null;
  if (typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "string") {
    return cause.code;
  }

  return null;
}

function isRetryableFetchError(error: unknown): boolean {
  const code = getFetchErrorCode(error);
  if (!code) {
    return false;
  }

  return ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "ENETUNREACH", "UND_ERR_CONNECT_TIMEOUT"].includes(code);
}

function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

const PRODUCTS_BY_COLLECTION_QUERY = `
  query ProductsByCollection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      handle
      products(first: $first) {
        nodes {
          id
          handle
          title
          description
          availableForSale
          productType
          tags
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 25) {
            nodes {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCTS_BY_QUERY_QUERY = `
  query ProductsByUniverseQuery($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      nodes {
        id
        handle
        title
        description
        availableForSale
        productType
        tags
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 25) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      availableForSale
      productType
      tags
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount {
      amount
      currencyCode
    }
    totalAmount {
      amount
      currencyCode
    }
    totalTaxAmount {
      amount
      currencyCode
    }
  }
  discountCodes {
    code
    applicable
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost {
          amountPerQuantity {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image {
              url
              altText
            }
            product {
              title
              handle
            }
          }
        }
      }
    }
  }
`;

const CART_QUERY = `
  query CartById($cartId: ID!) {
    cart(id: $cartId) {
      ${CART_FIELDS}
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        message
      }
    }
  }
`;

const CART_DISCOUNT_CODES_UPDATE_MUTATION = `
  mutation CartDiscountCodesUpdate($cartId: ID!, $codes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        message
      }
    }
  }
`;

export class ShopifyStorefrontError extends Error {
  statusCode: number;

  code: string;

  constructor(message: string, statusCode = 502, code = "shopify_storefront_error") {
    super(message);
    this.name = "ShopifyStorefrontError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

interface CartLineUpdateInput {
  id: string;
  quantity: number;
}

function getShopifyConfig(): ShopifyConfig {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim() || process.env.SHOPIFY_DOMAIN?.trim();
  const storefrontToken =
    process.env.SHOPIFY_STOREFRONT_TOKEN?.trim() || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_SHOPIFY_API_VERSION;

  if (!domain || !storefrontToken) {
    const missing: string[] = [];
    if (!domain) {
      missing.push("SHOPIFY_STORE_DOMAIN");
    }
    if (!storefrontToken) {
      missing.push("SHOPIFY_STOREFRONT_TOKEN (o SHOPIFY_STOREFRONT_ACCESS_TOKEN)");
    }

    throw new ShopifyStorefrontError(
      `Faltan variables de Shopify en runtime: ${missing.join(", ")}.`,
      503,
      "shopify_config_missing",
    );
  }

  return {
    domain: domain.replace(/^https?:\/\//, ""),
    storefrontToken,
    apiVersion,
  };
}

async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = getShopifyConfig();
  const endpoint = `https://${config.domain}/api/${config.apiVersion}/graphql.json`;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_STOREFRONT_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": config.storefrontToken,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        if (attempt < MAX_STOREFRONT_ATTEMPTS && isRetryableStatus(response.status)) {
          await delay(220 * attempt);
          continue;
        }

        throw new ShopifyStorefrontError("No se pudo conectar con Shopify Storefront.", 502, "shopify_http_error");
      }

      const payload = (await response.json()) as GraphQLResponse<T>;
      const firstError = payload.errors?.[0]?.message;
      if (firstError) {
        throw new ShopifyStorefrontError(firstError, 502, "shopify_graphql_error");
      }

      if (!payload.data) {
        throw new ShopifyStorefrontError("Shopify respondió sin datos.", 502, "shopify_empty_response");
      }

      return payload.data;
    } catch (error) {
      lastError = error;

      if (attempt < MAX_STOREFRONT_ATTEMPTS && isRetryableFetchError(error)) {
        await delay(220 * attempt);
        continue;
      }

      if (isRetryableFetchError(error)) {
        throw new ShopifyStorefrontError(
          "Shopify tardó en responder. Intenta de nuevo en unos segundos.",
          504,
          "shopify_network_timeout",
        );
      }

      throw error;
    }
  }

  if (isRetryableFetchError(lastError)) {
    throw new ShopifyStorefrontError(
      "Shopify tardó en responder. Intenta de nuevo en unos segundos.",
      504,
      "shopify_network_timeout",
    );
  }

  throw new ShopifyStorefrontError("No se pudo completar la solicitud a Shopify.", 502, "shopify_http_error");
}

function toShortDescription(description: string): string {
  const clean = description.replace(/\s+/g, " ").trim();
  if (clean.length <= 130) {
    return clean;
  }
  return `${clean.slice(0, 127).trimEnd()}...`;
}

function normalizeVariant(node: ShopifyProductVariantNode): ShopProductVariant {
  return {
    id: node.id,
    title: node.title,
    availableForSale: node.availableForSale,
    quantityAvailable: null,
    price: node.price,
  };
}

function inferUniverse(tags: string[], productType: string, title?: string): UniverseFilter | null {
  const normalizedType = productType.toLowerCase();
  if (normalizedType.includes("mega")) {
    return "mega";
  }
  if (normalizedType.includes("animals")) {
    return "animals";
  }
  if (normalizedType.includes("multiverse")) {
    return "multiverse";
  }

  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  if (normalizedTags.some((tag) => tag.includes("mega"))) {
    return "mega";
  }
  if (normalizedTags.some((tag) => tag.includes("animals"))) {
    return "animals";
  }
  if (normalizedTags.some((tag) => tag.includes("multiverse"))) {
    return "multiverse";
  }

  // Fallback: infer from product title
  if (title) {
    const normalizedTitle = title.toLowerCase();
    if (normalizedTitle.includes("mega")) {
      return "mega";
    }
  }

  return null;
}

function normalizeProduct(node: ShopifyProductNode): ShopProduct {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    shortDescription: toShortDescription(node.description),
    imageUrl: node.featuredImage?.url ?? null,
    imageAlt: node.featuredImage?.altText ?? null,
    availableForSale: node.availableForSale,
    price: node.priceRange.minVariantPrice,
    tags: node.tags ?? [],
    productType: node.productType ?? "",
    variants: node.variants.nodes.map(normalizeVariant),
    universe: inferUniverse(node.tags ?? [], node.productType ?? "", node.title),
  };
}

function normalizeCartLine(line: ShopifyCartNode["lines"]["edges"][number]["node"]): ShopCartLine {
  return {
    id: line.id,
    quantity: line.quantity,
    merchandiseId: line.merchandise.id,
    productTitle: line.merchandise.product.title,
    variantTitle: line.merchandise.title,
    productHandle: line.merchandise.product.handle,
    imageUrl: line.merchandise.image?.url ?? null,
    imageAlt: line.merchandise.image?.altText ?? null,
    availableForSale: line.merchandise.availableForSale,
    pricePerUnit: line.cost.amountPerQuantity,
    lineTotal: line.cost.totalAmount,
  };
}

function normalizeCart(node: ShopifyCartNode): ShopCart {
  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    lines: node.lines.edges.map((edge) => normalizeCartLine(edge.node)),
    subtotal: node.cost.subtotalAmount,
    total: node.cost.totalAmount,
    totalTax: node.cost.totalTaxAmount,
    discountCodes: node.discountCodes.map((code) => ({
      code: code.code,
      applicable: code.applicable,
    })),
  };
}

function assertNoUserErrors(
  userErrors: Array<{ message?: string }> | undefined,
  fallbackMessage: string,
): void {
  if (!userErrors?.length) {
    return;
  }

  const message = userErrors
    .map((error) => error.message?.trim())
    .filter(Boolean)
    .join(" | ");

  throw new ShopifyStorefrontError(message || fallbackMessage, 400, "shopify_cart_user_error");
}

function universeToCollectionHandle(universe: UniverseFilter): string | null {
  if (universe === "animals") {
    return process.env.SHOPIFY_COLLECTION_ANIMALS_HANDLE?.trim() || "animals";
  }
  if (universe === "mega") {
    return process.env.SHOPIFY_COLLECTION_MEGA_HANDLE?.trim() || "mega";
  }

  return process.env.SHOPIFY_COLLECTION_MULTIVERSE_HANDLE?.trim() || "multiverse";
}

export async function fetchShopProducts(universe: UniverseFilter): Promise<ShopProduct[]> {
  const collectionHandle = universeToCollectionHandle(universe);
  if (collectionHandle) {
    const data = await storefrontRequest<{
      collection: {
        products: {
          nodes: ShopifyProductNode[];
        };
      } | null;
    }>(PRODUCTS_BY_COLLECTION_QUERY, {
      handle: collectionHandle,
      first: MAX_PRODUCTS_PER_QUERY,
    });

    if (data.collection?.products.nodes) {
      return data.collection.products.nodes.map((node) => ({
        ...normalizeProduct(node),
        universe,
      }));
    }
  }

  const queryByUniverse = `tag:${universe} OR product_type:${universe}`;
  const fallbackData = await storefrontRequest<{
    products: {
      nodes: ShopifyProductNode[];
    };
  }>(PRODUCTS_BY_QUERY_QUERY, {
    query: queryByUniverse,
    first: MAX_PRODUCTS_PER_QUERY,
  });

  return fallbackData.products.nodes.map((node) => ({
    ...normalizeProduct(node),
    universe,
  }));
}

export async function fetchShopProductByHandle(handle: string): Promise<ShopProduct | null> {
  const data = await storefrontRequest<{
    product: ShopifyProductNode | null;
  }>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });

  if (!data.product) {
    return null;
  }

  return normalizeProduct(data.product);
}

export async function fetchCartById(cartId: string): Promise<ShopCart | null> {
  const data = await storefrontRequest<{
    cart: ShopifyCartNode | null;
  }>(CART_QUERY, {
    cartId,
  });

  if (!data.cart) {
    return null;
  }

  return normalizeCart(data.cart);
}

export async function createCart(lines: CartLineInput[] = []): Promise<ShopCart> {
  const data = await storefrontRequest<{
    cartCreate: {
      cart: ShopifyCartNode | null;
      userErrors: Array<{ message?: string }>;
    };
  }>(CART_CREATE_MUTATION, {
    lines: lines.length ? lines : undefined,
  });

  assertNoUserErrors(data.cartCreate.userErrors, "No se pudo crear el carrito.");

  if (!data.cartCreate.cart) {
    throw new ShopifyStorefrontError("Shopify no devolvió carrito al crear.", 502, "shopify_cart_missing");
  }

  return normalizeCart(data.cartCreate.cart);
}

export async function addCartLines(cartId: string, lines: CartLineInput[]): Promise<ShopCart> {
  const data = await storefrontRequest<{
    cartLinesAdd: {
      cart: ShopifyCartNode | null;
      userErrors: Array<{ message?: string }>;
    };
  }>(CART_LINES_ADD_MUTATION, {
    cartId,
    lines,
  });

  assertNoUserErrors(data.cartLinesAdd.userErrors, "No se pudieron agregar productos al carrito.");

  if (!data.cartLinesAdd.cart) {
    throw new ShopifyStorefrontError("Shopify no devolvió carrito al agregar líneas.", 502, "shopify_cart_missing");
  }

  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLines(cartId: string, lines: CartLineUpdateInput[]): Promise<ShopCart> {
  const data = await storefrontRequest<{
    cartLinesUpdate: {
      cart: ShopifyCartNode | null;
      userErrors: Array<{ message?: string }>;
    };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines,
  });

  assertNoUserErrors(data.cartLinesUpdate.userErrors, "No se pudieron actualizar las cantidades.");

  if (!data.cartLinesUpdate.cart) {
    throw new ShopifyStorefrontError("Shopify no devolvió carrito al actualizar.", 502, "shopify_cart_missing");
  }

  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<ShopCart> {
  const data = await storefrontRequest<{
    cartLinesRemove: {
      cart: ShopifyCartNode | null;
      userErrors: Array<{ message?: string }>;
    };
  }>(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds,
  });

  assertNoUserErrors(data.cartLinesRemove.userErrors, "No se pudieron quitar líneas.");

  if (!data.cartLinesRemove.cart) {
    throw new ShopifyStorefrontError("Shopify no devolvió carrito al remover líneas.", 502, "shopify_cart_missing");
  }

  return normalizeCart(data.cartLinesRemove.cart);
}

export async function updateCartDiscountCodes(cartId: string, codes: string[]): Promise<ShopCart> {
  const data = await storefrontRequest<{
    cartDiscountCodesUpdate: {
      cart: ShopifyCartNode | null;
      userErrors: Array<{ message?: string }>;
    };
  }>(CART_DISCOUNT_CODES_UPDATE_MUTATION, {
    cartId,
    codes,
  });

  assertNoUserErrors(data.cartDiscountCodesUpdate.userErrors, "No se pudo aplicar el cupón.");

  if (!data.cartDiscountCodesUpdate.cart) {
    throw new ShopifyStorefrontError("Shopify no devolvió carrito al aplicar descuento.", 502, "shopify_cart_missing");
  }

  return normalizeCart(data.cartDiscountCodesUpdate.cart);
}
