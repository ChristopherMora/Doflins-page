export type UniverseFilter = "animals" | "multiverse" | "mega";

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: ShopifyMoney;
}

export interface ShopProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  shortDescription: string;
  imageUrl: string | null;
  imageAlt: string | null;
  availableForSale: boolean;
  price: ShopifyMoney;
  tags: string[];
  productType: string;
  variants: ShopProductVariant[];
  universe: UniverseFilter | null;
}

export interface ShopCartLine {
  id: string;
  quantity: number;
  merchandiseId: string;
  productTitle: string;
  variantTitle: string;
  productHandle: string;
  imageUrl: string | null;
  imageAlt: string | null;
  availableForSale: boolean;
  pricePerUnit: ShopifyMoney;
  lineTotal: ShopifyMoney;
}

export interface ShopDiscountCode {
  code: string;
  applicable: boolean;
}

export interface ShopCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ShopCartLine[];
  subtotal: ShopifyMoney;
  total: ShopifyMoney;
  totalTax: ShopifyMoney | null;
  discountCodes: ShopDiscountCode[];
}

