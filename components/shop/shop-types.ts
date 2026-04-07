import type { ShopCart, ShopProduct, ShopProductVariant, ShopifyMoney, UniverseFilter } from "@/lib/shopify/types";
import type { CollectionItemDTO } from "@/lib/types/doflin";
import type { Universe } from "@/lib/universe-store";

export interface ProductsResponse {
  status: "ok";
  universe: UniverseFilter;
  products: ShopProduct[];
  cached: boolean;
  fetchedAt: string;
}

export interface CartResponse {
  status: "ok";
  cart: ShopCart | null;
}

export interface CheckoutResponse {
  status: "ok";
  checkoutUrl: string;
}

export interface CollectionResponse {
  status: "ok";
  collection: CollectionItemDTO[];
}

export type ApiError = Error & {
  code?: string;
};

export type DropTier = "common" | "special" | "epic" | "legendary";

export interface CartSnapshotLine {
  merchandiseId: string;
  quantity: number;
}

export interface CartSnapshotPayload {
  updatedAt: number;
  checkoutUrl: string | null;
  lines: CartSnapshotLine[];
}

export interface StockBadge {
  label: string;
  className: string;
  detail: string | null;
}

export interface ShopVisualTheme {
  shellClassName: "ink-light" | "ink-light-blue";
  shellBackground: string;
  shellBorder: string;
  shellShadow: string;
  primaryFrom: string;
  primaryTo: string;
  chipBg: string;
  chipText: string;
  chipRing: string;
  promoTimerBg: string;
  promoTimerText: string;
  supportChipHoverBg: string;
  supportChipHoverBorder: string;
  imagePanelBg: string;
  imageOverlay: string;
  imageFilter: string;
  imageShadow: string;
  addedBadgeBg: string;
  modalUniverseBadgeBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverShadow: string;
  controlBg: string;
  controlBorder: string;
  skeletonBase: string;
  skeletonHighlight: string;
}

export type SortOrder = "default" | "asc" | "desc" | "new";
export type GridView = "grid" | "list";

export interface FreeGiftProgress {
  enabled: boolean;
  unlocked: boolean;
  paidSubtotal: number;
  remaining: number;
  percent: number;
}

export interface CartTotals {
  subtotal: string;
  total: string;
  tax: string;
}

export interface CartRecoveryLinks {
  checkoutUrl: string;
  whatsapp: string;
  email: string;
}

/** Re-export commonly used types from shopify */
export type { ShopCart, ShopProduct, ShopProductVariant, ShopifyMoney, UniverseFilter };
export type { CollectionItemDTO };
export type { Universe };
