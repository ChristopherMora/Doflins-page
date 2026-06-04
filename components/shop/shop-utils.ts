import { CART_SNAPSHOT_STORAGE_KEY } from "@/lib/constants/shop";
import type { Rarity } from "@/lib/types/doflin";

import type {
  ApiError,
  CartSnapshotPayload,
  CollectionItemDTO,
  DropTier,
  ShopProduct,
  ShopProductVariant,
  ShopifyMoney,
  StockBadge,
  UniverseFilter,
} from "./shop-types";
import { CART_SNAPSHOT_MAX_AGE_MS, LOW_STOCK_THRESHOLD } from "./shop-constants";

export function readCartSnapshot(): CartSnapshotPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CART_SNAPSHOT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CartSnapshotPayload>;
    const lines = Array.isArray(parsed.lines)
      ? parsed.lines
          .map((line) => ({
            merchandiseId: typeof line?.merchandiseId === "string" ? line.merchandiseId : "",
            quantity: Number.isFinite(line?.quantity) ? Math.max(1, Math.floor(Number(line?.quantity))) : 1,
          }))
          .filter((line) => line.merchandiseId.length > 0)
      : [];
    const updatedAt = Number(parsed.updatedAt);
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > CART_SNAPSHOT_MAX_AGE_MS || lines.length === 0) {
      window.localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY);
      return null;
    }

    return {
      updatedAt,
      checkoutUrl: typeof parsed.checkoutUrl === "string" ? parsed.checkoutUrl : null,
      lines,
    };
  } catch {
    return null;
  }
}

export function writeCartSnapshot(cart: { lines: Array<{ merchandiseId: string; quantity: number }>; checkoutUrl?: string | null }): void {
  if (typeof window === "undefined") {
    return;
  }

  const lines = cart.lines
    .map((line) => ({
      merchandiseId: line.merchandiseId,
      quantity: Math.max(1, Math.floor(line.quantity)),
    }))
    .filter((line) => line.merchandiseId.length > 0);

  if (!lines.length) {
    window.localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY);
    return;
  }

  const payload: CartSnapshotPayload = {
    updatedAt: Date.now(),
    checkoutUrl: cart.checkoutUrl ?? null,
    lines,
  };

  try {
    window.localStorage.setItem(CART_SNAPSHOT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore write failures in private mode/quota limits.
  }
}

export function clearCartSnapshot(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY);
}

export function resolveStockBadge(variant: ShopProductVariant | null): StockBadge {
  const quantity =
    variant && typeof variant.quantityAvailable === "number" && Number.isFinite(variant.quantityAvailable)
      ? variant.quantityAvailable
      : null;

  if (!variant?.availableForSale || quantity === 0) {
    return {
      label: "Agotado",
      className: "bg-[#e5d3d3] text-[#7a3a3a] ring-1 ring-[#d6b8b8]",
      detail: null,
    };
  }

  if (quantity !== null && quantity <= LOW_STOCK_THRESHOLD) {
    return {
      label: "Pocas piezas",
      className: "bg-[#fde8c8] text-[#7a4a10] ring-1 ring-[#efcb92]",
      detail: `Solo ${quantity} disponible${quantity === 1 ? "" : "s"}`,
    };
  }

  return {
    label: "Disponible",
    className: "bg-[#dff0c7] text-[#2f5c1f] ring-1 ring-[#b7d494]",
    detail: quantity !== null ? `${quantity} disponibles` : null,
  };
}

export function formatMoney(money: ShopifyMoney | null | undefined): string {
  if (!money) {
    return "-";
  }

  const value = Number(money.amount);
  if (!Number.isFinite(value)) {
    return `${money.amount} ${money.currencyCode}`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    status?: string;
    message?: string;
    code?: string;
  };

  if (!response.ok || payload.status === "error") {
    const message = payload.message ?? "No se pudo completar la operación.";
    const error = new Error(message) as ApiError;
    error.code = payload.code;
    throw error;
  }

  return payload;
}

export function pickDefaultVariant(product: ShopProduct): ShopProductVariant | null {
  const firstAvailable = product.variants.find((variant) => variant.availableForSale);
  return firstAvailable ?? product.variants[0] ?? null;
}

export function getProductDescription(product: ShopProduct, universe: UniverseFilter): string {
  const clean = product.shortDescription.trim();
  if (clean.length > 0) {
    return clean;
  }

  if (universe === "animals") {
    return "Pack oficial del universo Animals para ampliar tu colección con estilo natural.";
  }

  if (universe === "mega") {
    return "Pack oficial MEGA — figuras gigantes para los coleccionistas más ambiciosos.";
  }

  return "Pack oficial del universo Multiverse con estética futurista y variantes especiales.";
}

export function toUniverseFromSeries(series: string): UniverseFilter | null {
  const normalized = series.trim().toLowerCase();
  if (normalized.includes("mega")) {
    return "mega";
  }
  if (normalized.includes("animal")) {
    return "animals";
  }
  if (normalized.includes("multiverse")) {
    return "multiverse";
  }
  return null;
}

export function toDropTier(rarity: Rarity): DropTier {
  if (rarity === "COMMON") {
    return "common";
  }
  if (rarity === "RARE") {
    return "special";
  }
  if (rarity === "EPIC") {
    return "epic";
  }
  return "legendary";
}

/** Extracts figure count from a product handle like "explorador-5" → 5 */
export function figureCountFromHandle(handle: string): number | null {
  const match = handle.match(/[-_](\d+)(?:[-_]|$)/);
  const n = match ? Number(match[1]) : null;
  return n && n > 0 ? n : null;
}

export function formatCollectionPreviewName(item: CollectionItemDTO): string {
  const base = item.baseModel.trim().replace(/^doflin\s+/i, "");
  const variant = item.variantName.trim();
  if (!variant || /^original$/i.test(variant)) {
    return base;
  }
  return `${base} ${variant}`.trim();
}
