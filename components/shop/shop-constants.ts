import {
  ClockIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

import type { DropTier, UniverseFilter } from "./shop-types";

export const UNIVERSE_LABELS: Record<UniverseFilter, string> = {
  animals: "Animals",
  multiverse: "Multiverse",
  mega: "MEGA",
};

export const BEST_SELLER_HANDLES = new Set(["safari-15"]);

/** Emotional tier label for packs based on price. */
export function getPackTier(price: number): { label: string; highlight: boolean } {
  if (price <= 200) return { label: "Entrada", highlight: false };
  if (price <= 400) return { label: "Recomendado", highlight: true };
  return { label: "Coleccionista", highlight: false };
}

export const BUNDLE_PROMO_CODE = process.env.NEXT_PUBLIC_BUNDLE_PROMO_CODE?.trim() ?? "";

const DEFAULT_LIVE_REFRESH_MS = 15_000;
const LIVE_REFRESH_MS_ENV = Number(process.env.NEXT_PUBLIC_SHOPIFY_LIVE_REFRESH_MS ?? DEFAULT_LIVE_REFRESH_MS);
export const LIVE_REFRESH_MS =
  Number.isFinite(LIVE_REFRESH_MS_ENV) && LIVE_REFRESH_MS_ENV >= 5_000 ? LIVE_REFRESH_MS_ENV : DEFAULT_LIVE_REFRESH_MS;

export const FREE_GIFT_PROMO_LABEL = process.env.NEXT_PUBLIC_FREE_GIFT_PROMO_LABEL?.trim() ?? "";
const FREE_GIFT_MIN_SUBTOTAL_ENV = Number(process.env.NEXT_PUBLIC_FREE_GIFT_MIN_SUBTOTAL ?? 450);
export const FREE_GIFT_MIN_SUBTOTAL =
  Number.isFinite(FREE_GIFT_MIN_SUBTOTAL_ENV) && FREE_GIFT_MIN_SUBTOTAL_ENV > 0 ? FREE_GIFT_MIN_SUBTOTAL_ENV : null;

export const LOW_STOCK_THRESHOLD = 5;
export const CART_SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

export const SUPPORT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL?.trim() ??
  "https://wa.me/529812425698?text=Hola%20equipo%20DOFLINS,%20necesito%20ayuda%20con%20mi%20compra.";

export const PROMO_EXPIRES_ENV = process.env.NEXT_PUBLIC_PROMO_EXPIRES?.trim() ?? "";

export const QTY_HISTORY_KEY = "doflins_qty_history_v1";
export const WISHLIST_KEY = "doflins_wishlist_v1";

export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHUlEQVQIW2NkYGD4z8BQDwIMjIz1DEDMSNMAACb9Av9aFEHzAAAAAElFTkSuQmCC";

export const SHOPPING_FAQ_ITEMS = [
  {
    question: "¿Cuánto tarda el envío?",
    answer: "El tiempo exacto aparece en Shopify Checkout según tu dirección. Normalmente se muestra antes de pagar.",
  },
  {
    question: "¿Puedo solicitar devolución?",
    answer: "Si tu pack llega con problema, contáctanos por WhatsApp para revisar el caso y ayudarte con la solución.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Los métodos disponibles se muestran en Shopify Checkout (por ejemplo PayPal y opciones activas de tu tienda).",
  },
] as const;

export const TRUST_PROMISES = [
  {
    title: "Pago protegido",
    detail: "Tu pago se procesa en Shopify Checkout con conexión segura.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Envío claro",
    detail: "Costos y tiempos se muestran antes de confirmar el pago.",
    icon: TruckIcon,
  },
  {
    title: "Soporte rápido",
    detail: "Te atendemos por WhatsApp para cualquier duda de tu pedido.",
    icon: ClockIcon,
  },
] as const;

export const DROP_TIER_ORDER: DropTier[] = ["common", "special", "epic", "legendary"];

export const DROP_TIER_LABELS: Record<DropTier, string> = {
  common: "Común",
  special: "Especial",
  epic: "Épica",
  legendary: "Legendaria",
};

export const DROP_TIER_PROBABILITY: Record<DropTier, number> = {
  common: 50,
  special: 30,
  epic: 15,
  legendary: 5,
};
