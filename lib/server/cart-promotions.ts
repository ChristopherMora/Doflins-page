import type { ShopCart, ShopCartLine } from "@/lib/shopify/types";
import { addCartLines, removeCartLines, updateCartLines } from "@/lib/server/shopify-storefront";

interface FreeGiftConfig {
  variantId: string | null;
  quantity: number;
  minPaidItems: number;
  minPaidSubtotal: number;
}

const DEFAULT_FREE_GIFT_QUANTITY = 1;
const DEFAULT_MIN_PAID_ITEMS = 1;
const DEFAULT_MIN_PAID_SUBTOTAL = 450;

function normalizeVariantId(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("gid://shopify/ProductVariant/")) {
    return raw;
  }

  if (/^\d+$/.test(raw)) {
    return `gid://shopify/ProductVariant/${raw}`;
  }

  return raw;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getFreeGiftConfig(): FreeGiftConfig {
  const variantId = normalizeVariantId(process.env.SHOPIFY_FREE_GIFT_VARIANT_ID);
  const quantity = parsePositiveInteger(process.env.SHOPIFY_FREE_GIFT_QUANTITY, DEFAULT_FREE_GIFT_QUANTITY);
  const minPaidItems = parsePositiveInteger(process.env.SHOPIFY_FREE_GIFT_MIN_PAID_ITEMS, DEFAULT_MIN_PAID_ITEMS);
  const minPaidSubtotal = parsePositiveNumber(process.env.SHOPIFY_FREE_GIFT_MIN_PAID_SUBTOTAL, DEFAULT_MIN_PAID_SUBTOTAL);

  return {
    variantId,
    quantity,
    minPaidItems,
    minPaidSubtotal,
  };
}

function isGiftLineWithVariant(line: ShopCartLine, variantId: string | null): boolean {
  return Boolean(variantId && line.merchandiseId === variantId);
}

function paidItemsQuantity(cart: ShopCart, variantId: string | null): number {
  return cart.lines
    .filter((line) => !isGiftLineWithVariant(line, variantId))
    .reduce((total, line) => total + line.quantity, 0);
}

function paidSubtotalAmount(cart: ShopCart, variantId: string | null): number {
  return cart.lines
    .filter((line) => !isGiftLineWithVariant(line, variantId))
    .reduce((total, line) => {
      const amount = Number(line.lineTotal.amount);
      if (!Number.isFinite(amount)) {
        return total;
      }

      return total + amount;
    }, 0);
}

function qualifiesForFreeGift(cart: ShopCart, config: FreeGiftConfig): boolean {
  const hasRequiredPaidItems = paidItemsQuantity(cart, config.variantId) >= config.minPaidItems;
  const hasRequiredSubtotal = paidSubtotalAmount(cart, config.variantId) >= config.minPaidSubtotal;

  return hasRequiredPaidItems && hasRequiredSubtotal;
}

export function isFreeGiftEnabled(): boolean {
  return Boolean(getFreeGiftConfig().variantId);
}

export function hasPaidCartBase(cart: ShopCart): boolean {
  const config = getFreeGiftConfig();
  return paidItemsQuantity(cart, config.variantId) > 0;
}

export function isFreeGiftLine(line: ShopCartLine): boolean {
  const config = getFreeGiftConfig();
  return isGiftLineWithVariant(line, config.variantId);
}

export async function syncFreeGiftForCart(cartId: string, cart: ShopCart): Promise<ShopCart> {
  const config = getFreeGiftConfig();
  if (!config.variantId) {
    return cart;
  }

  const minimumPaidReached = qualifiesForFreeGift(cart, config);
  const giftLines = cart.lines.filter((line) => isGiftLineWithVariant(line, config.variantId));

  let nextCart = cart;

  if (!minimumPaidReached) {
    if (!giftLines.length) {
      return nextCart;
    }

    try {
      return await removeCartLines(
        cartId,
        giftLines.map((line) => line.id),
      );
    } catch (error) {
      console.error("syncFreeGiftForCart: no se pudo remover regalo sin compra base", error);
      return nextCart;
    }
  }

  if (!giftLines.length) {
    try {
      return await addCartLines(cartId, [
        {
          merchandiseId: config.variantId,
          quantity: config.quantity,
        },
      ]);
    } catch (error) {
      console.error("syncFreeGiftForCart: no se pudo agregar regalo", error);
      return nextCart;
    }
  }

  const [firstGiftLine, ...extraGiftLines] = giftLines;
  if (extraGiftLines.length > 0) {
    try {
      nextCart = await removeCartLines(
        cartId,
        extraGiftLines.map((line) => line.id),
      );
    } catch (error) {
      console.error("syncFreeGiftForCart: no se pudieron limpiar regalos duplicados", error);
      return nextCart;
    }
  }

  const currentGiftLine = nextCart.lines.find((line) => isGiftLineWithVariant(line, config.variantId)) ?? firstGiftLine;
  if (!currentGiftLine || currentGiftLine.quantity === config.quantity) {
    return nextCart;
  }

  try {
    return await updateCartLines(cartId, [
      {
        id: currentGiftLine.id,
        quantity: config.quantity,
      },
    ]);
  } catch (error) {
    console.error("syncFreeGiftForCart: no se pudo ajustar cantidad del regalo", error);
    return nextCart;
  }
}
