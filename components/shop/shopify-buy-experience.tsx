"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  EnvelopeIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PhotoIcon,
  PlusIcon,
  ShareIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  Squares2X2Icon,
  TruckIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

import type { ShopCart, ShopProduct, ShopProductVariant, ShopifyMoney, UniverseFilter } from "@/lib/shopify/types";
import { Badge } from "@/components/ui/badge";
import { WatchingBadge } from "@/components/ui/watching-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProductsResponse {
  status: "ok";
  universe: UniverseFilter;
  products: ShopProduct[];
  cached: boolean;
  fetchedAt: string;
}

interface CartResponse {
  status: "ok";
  cart: ShopCart | null;
}

interface CheckoutResponse {
  status: "ok";
  checkoutUrl: string;
}

type ApiError = Error & {
  code?: string;
};

const UNIVERSE_LABELS: Record<UniverseFilter, string> = {
  animals: "Animals",
  multiverse: "Multiverse",
};
const BEST_SELLER_HANDLES = new Set(["safari-15"]);
const DEFAULT_LIVE_REFRESH_MS = 15_000;
const LIVE_REFRESH_MS_ENV = Number(process.env.NEXT_PUBLIC_SHOPIFY_LIVE_REFRESH_MS ?? DEFAULT_LIVE_REFRESH_MS);
const LIVE_REFRESH_MS =
  Number.isFinite(LIVE_REFRESH_MS_ENV) && LIVE_REFRESH_MS_ENV >= 5_000 ? LIVE_REFRESH_MS_ENV : DEFAULT_LIVE_REFRESH_MS;
const FREE_GIFT_PROMO_LABEL = process.env.NEXT_PUBLIC_FREE_GIFT_PROMO_LABEL?.trim() ?? "";
const FREE_GIFT_MIN_SUBTOTAL_ENV = Number(process.env.NEXT_PUBLIC_FREE_GIFT_MIN_SUBTOTAL ?? 1200);
const FREE_GIFT_MIN_SUBTOTAL =
  Number.isFinite(FREE_GIFT_MIN_SUBTOTAL_ENV) && FREE_GIFT_MIN_SUBTOTAL_ENV > 0 ? FREE_GIFT_MIN_SUBTOTAL_ENV : null;
const LOW_STOCK_THRESHOLD = 5;
const CART_SNAPSHOT_STORAGE_KEY = "doflins_cart_snapshot_v1";
const CART_SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
const SUPPORT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL?.trim() ??
  "https://wa.me/529812425698?text=Hola%20equipo%20DOFLINS,%20necesito%20ayuda%20con%20mi%20compra.";
const PROMO_EXPIRES_ENV = process.env.NEXT_PUBLIC_PROMO_EXPIRES?.trim() ?? "";
const QTY_HISTORY_KEY = "doflins_qty_history_v1";
const WISHLIST_KEY = "doflins_wishlist_v1";
// 4×4 blurry greenish placeholder para next/image con imágenes externas
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHUlEQVQIW2NkYGD4z8BQDwIMjIz1DEDMSNMAACb9Av9aFEHzAAAAAElFTkSuQmCC";
const SHOPPING_FAQ_ITEMS = [
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
const TRUST_PROMISES = [
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

interface CartSnapshotLine {
  merchandiseId: string;
  quantity: number;
}

interface CartSnapshotPayload {
  updatedAt: number;
  checkoutUrl: string | null;
  lines: CartSnapshotLine[];
}

interface StockBadge {
  label: string;
  className: string;
  detail: string | null;
}

function readCartSnapshot(): CartSnapshotPayload | null {
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

function writeCartSnapshot(cart: ShopCart): void {
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

function clearCartSnapshot(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY);
}

function resolveStockBadge(variant: ShopProductVariant | null): StockBadge {
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

function formatMoney(money: ShopifyMoney | null): string {
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

function formatCurrencyAmount(amount: number, currencyCode: string): string {
  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
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

function pickDefaultVariant(product: ShopProduct): ShopProductVariant | null {
  const firstAvailable = product.variants.find((variant) => variant.availableForSale);
  return firstAvailable ?? product.variants[0] ?? null;
}

function getProductDescription(product: ShopProduct, universe: UniverseFilter): string {
  const clean = product.shortDescription.trim();
  if (clean.length > 0) {
    return clean;
  }

  if (universe === "animals") {
    return "Pack oficial del universo Animals para ampliar tu colección con estilo natural.";
  }

  return "Pack oficial del universo Multiverse con estética futurista y variantes especiales.";
}

function LazyCard({ children, skeleton }: { children: React.ReactNode; skeleton: React.ReactNode }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "160px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref}>{visible ? children : skeleton}</div>;
}

export function ShopifyBuyExperience(): React.JSX.Element {
  const [activeUniverse, setActiveUniverse] = useState<UniverseFilter>("animals");

  // Pre-filtrar universo desde ?universe= en la URL (e.g. venido del reveal)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("universe");
    if (u === "animals" || u === "multiverse") {
      setActiveUniverse(u);
    }
  }, []);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [liveNewProducts, setLiveNewProducts] = useState<Record<UniverseFilter, string[]>>({
    animals: [],
    multiverse: [],
  });
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isMutatingCart, setIsMutatingCart] = useState(false);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [quantityByProduct, setQuantityByProduct] = useState<Record<string, number>>({});
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc" | "new">("default");
  const [confettiByProduct, setConfettiByProduct] = useState<Set<string>>(new Set());
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsErrorCode, setProductsErrorCode] = useState<string | null>(null);
  const [gridAnimKey, setGridAnimKey] = useState(0);
  const [giftNote, setGiftNote] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [promoTimeLeft, setPromoTimeLeft] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [gridView, setGridView] = useState<"grid" | "list">("grid");
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [isFabHovered, setIsFabHovered] = useState(false);
  const [showCartQR, setShowCartQR] = useState(false);
  const knownProductIdsRef = useRef<Record<UniverseFilter, Set<string>>>({
    animals: new Set(),
    multiverse: new Set(),
  });
  const prevStockRef = useRef<Map<string, boolean>>(new Map());
  const liveRefreshInFlightRef = useRef(false);
  const snapshotRecoveryAttemptedRef = useRef(false);

  const getProductQty = useCallback((productId: string): number => quantityByProduct[productId] ?? 1, [quantityByProduct]);
  const setProductQty = useCallback((productId: string, qty: number) => {
    setQuantityByProduct((prev) => {
      const next = { ...prev, [productId]: Math.max(1, Math.min(99, qty)) };
      try { localStorage.setItem(QTY_HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      const added = !next.has(productId);
      if (added) next.add(productId);
      else next.delete(productId);
      try { localStorage.setItem(WISHLIST_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      if (added) {
        toast.success("Guardado en favoritos", {
          action: {
            label: "Ver favoritos",
            onClick: () => setShowWishlistOnly(true),
          },
          duration: 3500,
        });
      }
      return next;
    });
  }, []);

  const cartItemCount = cart?.totalQuantity ?? 0;

  const tryRestoreCartFromSnapshot = useCallback(async (): Promise<ShopCart | null> => {
    if (snapshotRecoveryAttemptedRef.current) {
      return null;
    }
    snapshotRecoveryAttemptedRef.current = true;

    const snapshot = readCartSnapshot();
    if (!snapshot?.lines.length) {
      return null;
    }

    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lines: snapshot.lines,
        }),
      });
      const payload = await parseApiResponse<CartResponse>(response);
      if (!payload.cart) {
        clearCartSnapshot();
        return null;
      }
      setFeedbackMessage("Recuperamos tu carrito guardado en este dispositivo.");
      return payload.cart;
    } catch {
      return null;
    }
  }, []);

  const loadCart = useCallback(async () => {
    setIsLoadingCart(true);
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await parseApiResponse<CartResponse>(response);

      if (payload.cart) {
        setCart(payload.cart);
        return;
      }

      const restoredCart = await tryRestoreCartFromSnapshot();
      setCart(restoredCart);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo cargar el carrito.");
    } finally {
      setIsLoadingCart(false);
    }
  }, [tryRestoreCartFromSnapshot]);

  const loadProducts = useCallback(
    async (
      universe: UniverseFilter,
      options: {
        silent?: boolean;
        forceRealtime?: boolean;
      } = {},
    ) => {
      const { silent = false, forceRealtime = false } = options;
      if (!silent) {
        setIsLoadingProducts(true);
      }

      const query = new URLSearchParams({
        universe,
      });
      if (forceRealtime) {
        query.set("realtime", "1");
      }

      if (!silent) {
        setProductsError(null);
        setProductsErrorCode(null);
      }

      try {
        const response = await fetch(`/api/shop/products?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await parseApiResponse<ProductsResponse>(response);

        const knownIds = knownProductIdsRef.current[universe];
        if (knownIds.size > 0) {
          const incomingNewIds = payload.products
            .map((product) => product.id)
            .filter((productId) => !knownIds.has(productId));

          if (incomingNewIds.length > 0) {
            setLiveNewProducts((previous) => ({
              ...previous,
              [universe]: [...new Set([...previous[universe], ...incomingNewIds])],
            }));
            setFeedbackMessage(
              `${incomingNewIds.length} pack${incomingNewIds.length === 1 ? "" : "s"} nuevo${
                incomingNewIds.length === 1 ? "" : "s"
              } en ${UNIVERSE_LABELS[universe]}.`,
            );
          }
        }

        for (const product of payload.products) {
          knownIds.add(product.id);
        }

        setProducts(payload.products);
        setProductsErrorCode(null);
        setSelectedVariantByProduct((previous) => {
          const next = { ...previous };
          for (const product of payload.products) {
            if (next[product.id]) {
              continue;
            }
            const defaultVariant = pickDefaultVariant(product);
            if (defaultVariant) {
              next[product.id] = defaultVariant.id;
            }
          }
          return next;
        });
      } catch (error) {
        const code = (error as ApiError)?.code ?? null;
        const baseMessage = error instanceof Error ? error.message : "No se pudieron cargar los productos.";
        const nextMessage =
          code === "shopify_config_missing"
            ? "La compra está temporalmente desconfigurada en Shopify. Puedes reintentar o contactarnos por WhatsApp."
            : code === "shopify_network_timeout"
              ? "No pudimos conectar con Shopify en este momento. Intenta nuevamente."
              : baseMessage;
        if (!silent) {
          setProductsError(nextMessage);
          setProductsErrorCode(code);
        }
        if (!silent) {
          setProducts([]);
        }
      } finally {
        if (!silent) {
          setIsLoadingProducts(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  // Restore wishlist from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setWishlist(new Set(parsed));
      }
    } catch { /* ignore */ }
  }, []);

  // Restock notifications: detect when a wishlist product comes back in stock
  useEffect(() => {
    const prev = prevStockRef.current;
    for (const product of products) {
      const nowAvailable = product.variants.some((v) => v.availableForSale);
      const wasAvailable = prev.get(product.id);
      // Only fire when going from explicitly-unavailable to available (not on first load)
      if (wasAvailable === false && nowAvailable && wishlist.has(product.id)) {
        toast.success(`¡${product.title} volvió al stock!`, {
          duration: 7000,
          action: {
            label: "Ver",
            onClick: () => setSelectedProduct(product),
          },
        });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 80, 200]);
        }
      }
      prev.set(product.id, nowAvailable);
    }
  }, [products, wishlist]);

  // Restore qty history from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QTY_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        if (parsed && typeof parsed === "object") {
          setQuantityByProduct(parsed);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Promo countdown
  useEffect(() => {
    if (!PROMO_EXPIRES_ENV || !FREE_GIFT_MIN_SUBTOTAL) return;
    const expiresAt = new Date(PROMO_EXPIRES_ENV).getTime();
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return;
    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setPromoTimeLeft(null); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setPromoTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    void loadProducts(activeUniverse);
  }, [activeUniverse, loadProducts]);

  useEffect(() => {
    const refreshCatalog = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      if (liveRefreshInFlightRef.current) {
        return;
      }

      liveRefreshInFlightRef.current = true;
      try {
        await loadProducts(activeUniverse, {
          silent: true,
          forceRealtime: true,
        });
      } finally {
        liveRefreshInFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshCatalog();
    }, LIVE_REFRESH_MS);

    const onWindowFocus = () => {
      void refreshCatalog();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void refreshCatalog();
      }
    };

    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeUniverse, loadProducts]);

  useEffect(() => {
    if (isLoadingCart) {
      return;
    }

    if (cart?.lines.length) {
      writeCartSnapshot(cart);
      return;
    }

    clearCartSnapshot();
  }, [cart, isLoadingCart]);

  const applyCartPayload = useCallback((nextCart: ShopCart) => {
    setCart(nextCart);
    setIsCartOpen(true);
  }, []);

  const getSelectedVariant = useCallback(
    (product: ShopProduct): ShopProductVariant | null => {
      const selectedId = selectedVariantByProduct[product.id];
      return product.variants.find((variant) => variant.id === selectedId) ?? pickDefaultVariant(product);
    },
    [selectedVariantByProduct],
  );

  const addToCart = useCallback(
    async (product: ShopProduct, quantity = 1) => {
      const selectedVariant = getSelectedVariant(product);
      const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
      if (!selectedVariant) {
        setFeedbackMessage("Este producto no tiene variantes disponibles para compra.");
        return;
      }

      if (!selectedVariant.availableForSale) {
        setFeedbackMessage("Este pack está agotado por ahora.");
        return;
      }

      setIsMutatingCart(true);
      setFeedbackMessage(null);
      try {
        const response = await fetch("/api/cart/lines/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lines: [
              {
                merchandiseId: selectedVariant.id,
                quantity: normalizedQuantity,
              },
            ],
          }),
        });
        const payload = await parseApiResponse<CartResponse>(response);
        if (!payload.cart) {
          throw new Error("No se pudo actualizar el carrito.");
        }
        applyCartPayload(payload.cart);
        setLastAddedProductId(product.id);
        setTimeout(() => setLastAddedProductId(null), 700);
        setConfettiByProduct((prev) => new Set([...prev, product.id]));
        setTimeout(
          () =>
            setConfettiByProduct((prev) => {
              const next = new Set(prev);
              next.delete(product.id);
              return next;
            }),
          850,
        );
        toast.success(`${product.title} al carrito`, {
          description: `${normalizedQuantity} pack${normalizedQuantity === 1 ? "" : "s"} agregado${normalizedQuantity === 1 ? "" : "s"} correctamente.`,
          duration: 2500,
        });
        setFeedbackMessage(`${product.title} x${normalizedQuantity} agregado al carrito.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo agregar al carrito.";
        const code = (error as ApiError)?.code;

        if (code === "shopify_network_timeout") {
          setFeedbackMessage("Shopify tardó en responder. Intenta de nuevo en unos segundos.");
          return;
        }

        if (code === "shopify_cart_user_error" && /no existe/i.test(message)) {
          await loadProducts(activeUniverse);
          setFeedbackMessage("El catálogo cambió en Shopify. Ya lo recargamos; intenta agregar de nuevo.");
          return;
        }

        setFeedbackMessage(message);
      } finally {
        setIsMutatingCart(false);
      }
    },
    [activeUniverse, applyCartPayload, getSelectedVariant, loadProducts],
  );

  const updateLineQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (quantity <= 0) {
        return;
      }

      setIsMutatingCart(true);
      setFeedbackMessage(null);
      try {
        const response = await fetch("/api/cart/lines/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lines: [{ id: lineId, quantity }],
          }),
        });
        const payload = await parseApiResponse<CartResponse>(response);
        if (!payload.cart) {
          throw new Error("No se pudo actualizar el carrito.");
        }
        setCart(payload.cart);
      } catch (error) {
        setFeedbackMessage(error instanceof Error ? error.message : "No se pudo actualizar la cantidad.");
      } finally {
        setIsMutatingCart(false);
      }
    },
    [],
  );

  const removeLine = useCallback(async (lineId: string) => {
    setFeedbackMessage(null);
    // Capture previous state and apply optimistic update in one step
    let previousCart: ShopCart | null = null;
    setCart((prev) => {
      previousCart = prev;
      if (!prev) return prev;
      return { ...prev, lines: prev.lines.filter((l) => l.id !== lineId) };
    });
    try {
      const response = await fetch("/api/cart/lines/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineIds: [lineId] }),
      });
      const payload = await parseApiResponse<CartResponse>(response);
      if (!payload.cart) {
        throw new Error("No se pudo actualizar el carrito.");
      }
      // Confirm with server response (updates totals, discounts, etc.)
      setCart(payload.cart);
    } catch (error) {
      // Revert optimistic update
      setCart(previousCart);
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo eliminar el item.");
    }
  }, []);

  const applyDiscount = useCallback(async () => {
    const normalized = discountCode.trim();
    if (!normalized) {
      return;
    }

    setIsMutatingCart(true);
    setFeedbackMessage(null);
    try {
      const response = await fetch("/api/cart/discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: normalized,
        }),
      });
      const payload = await parseApiResponse<
        CartResponse & {
          coupon?: {
            code: string;
            applied: boolean;
          };
        }
      >(response);

      if (!payload.cart) {
        throw new Error("No se pudo aplicar el cupón.");
      }

      setCart(payload.cart);
      setFeedbackMessage(payload.coupon?.applied ? "Cupón aplicado correctamente." : "Cupón enviado, revisa si aplica en tu carrito.");
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo aplicar el cupón.");
    } finally {
      setIsMutatingCart(false);
    }
  }, [discountCode]);

  const goToCheckout = useCallback(async () => {
    setIsMutatingCart(true);
    setFeedbackMessage(null);
    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
      });
      const payload = await parseApiResponse<CheckoutResponse>(response);
      let url = payload.checkoutUrl;
      if (giftNote.trim()) {
        url += (url.includes("?") ? "&" : "?") + `note=${encodeURIComponent(giftNote.trim())}`;
      }
      // Open checkout in a new tab (Shopify blocks iframe embedding)
      window.open(url, "_blank", "noopener,noreferrer");
      setIsCartOpen(false);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo abrir checkout.");
    } finally {
      setIsMutatingCart(false);
    }
  }, [giftNote]);

  const totals = useMemo(() => {
    if (!cart) {
      return {
        subtotal: "-",
        total: "-",
        tax: "-",
      };
    }

    return {
      subtotal: formatMoney(cart.subtotal),
      total: formatMoney(cart.total),
      tax: formatMoney(cart.totalTax),
    };
  }, [cart]);

  const freeGiftProgress = useMemo(() => {
    if (!FREE_GIFT_MIN_SUBTOTAL) {
      return {
        enabled: false,
        unlocked: false,
        paidSubtotal: 0,
        remaining: 0,
        percent: 0,
      };
    }

    const paidSubtotal = (cart?.lines ?? []).reduce((total, line) => {
      const unitAmount = Number(line.pricePerUnit.amount);
      const lineAmount = Number(line.lineTotal.amount);
      if (!Number.isFinite(unitAmount) || !Number.isFinite(lineAmount)) {
        return total;
      }

      if (unitAmount <= 0) {
        return total;
      }

      return total + lineAmount;
    }, 0);

    const unlocked = paidSubtotal >= FREE_GIFT_MIN_SUBTOTAL;
    const remaining = Math.max(0, FREE_GIFT_MIN_SUBTOTAL - paidSubtotal);
    const percent = Math.min(100, (paidSubtotal / FREE_GIFT_MIN_SUBTOTAL) * 100);

    return {
      enabled: true,
      unlocked,
      paidSubtotal,
      remaining,
      percent,
    };
  }, [cart]);

  const stickyProduct = useMemo(() => {
    if (!products.length) {
      return null;
    }

    const bestSeller = products.find((product) => BEST_SELLER_HANDLES.has(product.handle.toLowerCase()) && getSelectedVariant(product)?.availableForSale);
    if (bestSeller) {
      return bestSeller;
    }

    return products.find((product) => getSelectedVariant(product)?.availableForSale) ?? products[0] ?? null;
  }, [getSelectedVariant, products]);

  const stickyVariant = stickyProduct ? getSelectedVariant(stickyProduct) : null;
  const stickyCtaDisabled = isMutatingCart || !stickyProduct || !stickyVariant?.availableForSale;

  const cartRecoveryLinks = useMemo(() => {
    if (!cart?.checkoutUrl) {
      return null;
    }

    const checkoutUrl = cart.checkoutUrl;
    const recoveryText = `Guardé mi carrito DOFLINS para retomarlo después: ${checkoutUrl}`;

    return {
      checkoutUrl,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(recoveryText)}`,
      email: `mailto:?subject=${encodeURIComponent("Mi carrito DOFLINS")}&body=${encodeURIComponent(recoveryText)}`,
    };
  }, [cart?.checkoutUrl]);

  const copyRecoveryLink = useCallback(async () => {
    if (!cartRecoveryLinks?.checkoutUrl) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setFeedbackMessage("No se pudo copiar automáticamente. Comparte el enlace desde WhatsApp o email.");
      return;
    }

    try {
      await navigator.clipboard.writeText(cartRecoveryLinks.checkoutUrl);
      setFeedbackMessage("Link del carrito copiado.");
    } catch {
      setFeedbackMessage("No se pudo copiar el link del carrito.");
    }
  }, [cartRecoveryLinks]);

  const currencyCode = products[0]?.price.currencyCode ?? "MXN";
  const pricingCurrencyCode = cart?.subtotal.currencyCode ?? currencyCode;

  const getLineQtyAvailable = useCallback(
    (merchandiseId: string): number | null => {
      for (const p of products) {
        const v = p.variants.find((variant) => variant.id === merchandiseId);
        if (v) return v.quantityAvailable;
      }
      return null;
    },
    [products],
  );

  const sortedProducts = useMemo(() => {
    if (sortOrder === "new") {
      const newSet = new Set(liveNewProducts[activeUniverse]);
      return [...products].sort((a, b) => {
        const an = newSet.has(a.id) ? 0 : 1;
        const bn = newSet.has(b.id) ? 0 : 1;
        return an - bn;
      });
    }
    if (sortOrder === "default") return [...products];
    return [...products].sort((a, b) => {
      const pa = Number(a.price.amount);
      const pb = Number(b.price.amount);
      return sortOrder === "asc" ? pa - pb : pb - pa;
    });
  }, [products, sortOrder, liveNewProducts, activeUniverse]);

  const filteredProducts = useMemo(() => {
    let base = sortedProducts;
    if (showWishlistOnly) base = base.filter((p) => wishlist.has(p.id));
    if (!shopSearch.trim()) return base;
    const q = shopSearch.trim().toLowerCase();
    return base.filter(
      (p) => p.title.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q),
    );
  }, [sortedProducts, shopSearch, showWishlistOnly, wishlist]);

  const productsCountLabel = `${products.length} pack${products.length === 1 ? "" : "s"}`;
  const selectedModalVariant = selectedProduct ? getSelectedVariant(selectedProduct) : null;
  const selectedModalSoldOut = !selectedModalVariant?.availableForSale;
  const selectedModalStock = resolveStockBadge(selectedModalVariant);
  const hasCartLines = Boolean(cart?.lines.length);
  const retryProductsLoad = useCallback(() => {
    void loadProducts(activeUniverse, {
      forceRealtime: true,
    });
  }, [activeUniverse, loadProducts]);

  return (
    <section id="compras" className="space-y-5 pb-28 lg:pb-6">
      <Card className="ink-light border border-[#d9cfa8] bg-[linear-gradient(145deg,#fffaf0,#f2f6e8)] shadow-[0_18px_36px_rgba(86,98,51,0.16)]">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <Badge className="w-fit bg-[#e8efd8] text-[var(--ink-900)]">
                <ShoppingCartIcon className="h-4 w-4" /> Pago 100% seguro
              </Badge>
              <h3 className="font-title text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">Compra tus packs DOFLINS</h3>
              <p className="max-w-2xl text-sm text-[var(--ink-700)] sm:text-base">
                Elige tu pack, agrégalo al carrito y paga de forma segura. Nunca guardamos tu tarjeta.
              </p>
              {FREE_GIFT_PROMO_LABEL || FREE_GIFT_MIN_SUBTOTAL ? (
                <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f5d8] px-3 py-1 text-xs font-semibold text-[#2f5c1f] ring-1 ring-[#bfd89b]">
                  {FREE_GIFT_PROMO_LABEL || `Regalo gratis en compras desde ${formatCurrencyAmount(FREE_GIFT_MIN_SUBTOTAL ?? 0, pricingCurrencyCode)}`}
                  {promoTimeLeft ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#d0edb8] px-2 py-0.5 text-[#1e4f12]">
                      <ClockIcon className="h-3 w-3" />
                      {promoTimeLeft}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[var(--ink-700)] ring-1 ring-[#d6d2b4]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> {productsCountLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[var(--ink-700)] ring-1 ring-[#d6d2b4]">
                  <ClockIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Tu carrito se guarda solo
                </span>
                <WatchingBadge universe={activeUniverse} />
              </div>
            </div>

            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className="h-12 shrink-0 bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-6">
                  <ShoppingCartIcon className="h-5 w-5" /> Carrito ({cartItemCount})
                </Button>
              </SheetTrigger>
              <SheetContent className="flex h-full w-[min(100vw,460px)] flex-col p-0" side="right">
                <div className="flex-1 space-y-4 overflow-y-auto p-5 pb-28">
                  <SheetHeader>
                    <SheetTitle>Tu carrito DOFLINS</SheetTitle>
                    <SheetDescription>Revisa tus packs y procede al pago cuando estés listo.</SheetDescription>
                  </SheetHeader>
                  <p className="text-xs text-[var(--ink-600)]">Guardamos tu carrito en este dispositivo para que no pierdas tu avance.</p>

                  {isLoadingCart ? <p className="text-sm text-[var(--ink-700)]">Cargando carrito...</p> : null}

                  {!isLoadingCart && (!cart || cart.lines.length === 0) ? (
                    <p className="rounded-2xl border border-[#d7d7c3] bg-white/80 p-4 text-sm text-[var(--ink-700)]">
                      Aún no tienes productos en carrito.
                    </p>
                  ) : null}

                  {!isLoadingCart ? (
                    <div className="space-y-2 rounded-2xl border border-[#d8dcc5] bg-[linear-gradient(160deg,#ffffff,#f5f8e9)] p-4">
                      <p className="text-sm font-semibold text-[var(--ink-900)]">Tu compra en 3 pasos</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div
                          className={`rounded-xl border px-2 py-2 text-center text-xs ${
                            hasCartLines ? "border-[#b8d493] bg-[#edf8dd] text-[#2e5d1e]" : "border-[#dddcc8] bg-white text-[var(--ink-700)]"
                          }`}
                        >
                          1. Carrito
                        </div>
                        <div
                          className={`rounded-xl border px-2 py-2 text-center text-xs ${
                            hasCartLines ? "border-[#b8d493] bg-[#edf8dd] text-[#2e5d1e]" : "border-[#dddcc8] bg-white text-[var(--ink-700)]"
                          }`}
                        >
                          2. Pago
                        </div>
                        <div className="rounded-xl border border-[#dddcc8] bg-white px-2 py-2 text-center text-xs text-[var(--ink-700)]">
                          3. Confirmación
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {cart?.lines.map((line) => {
                    const isFreeLine = Number(line.pricePerUnit.amount) <= 0;

                    return (
                      <article key={line.id} className="animate-catalog-fadein rounded-2xl border border-[#d7d7c3] bg-white/85 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {line.imageUrl ? (
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#ddd9c5] bg-[#f1f2e6]">
                                <Image
                                  src={line.imageUrl}
                                  alt={line.imageAlt ?? line.productTitle}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : null}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-[var(--ink-900)]">{line.productTitle}</p>
                                {isFreeLine ? (
                                  <span className="rounded-full bg-[#e8f5d8] px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-[#2f5c1f] ring-1 ring-[#bfd89b]">
                                    Gratis
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-[var(--ink-700)]">{line.variantTitle}</p>
                              <p className="mt-1 text-sm text-[var(--ink-700)]">{formatMoney(line.lineTotal)}</p>
                              {(() => {
                                const avail = getLineQtyAvailable(line.merchandiseId);
                                return avail !== null && avail > 0 && avail <= 5 ? (
                                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700">
                                    <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Solo quedan {avail}
                                  </p>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            disabled={isMutatingCart}
                            onClick={() => void removeLine(line.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2"
                            disabled={isMutatingCart || line.quantity <= 1}
                            onClick={() => void updateLineQuantity(line.id, Math.max(1, line.quantity - 1))}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                          <span className="min-w-6 text-center text-sm font-semibold text-[var(--ink-900)]">{line.quantity}</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2"
                            disabled={isMutatingCart}
                            onClick={() => void updateLineQuantity(line.id, line.quantity + 1)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </article>
                    );
                  })}

                  {freeGiftProgress.enabled && cart?.lines.length ? (
                    <div className="space-y-2 rounded-2xl border border-[#cfdab2] bg-[#eef5df] p-4 text-sm text-[var(--ink-700)]">
                      <p className="font-semibold text-[var(--ink-900)]">
                        {freeGiftProgress.unlocked
                          ? "Regalo gratis desbloqueado"
                          : `Te faltan ${formatCurrencyAmount(freeGiftProgress.remaining, pricingCurrencyCode)} para tu regalo gratis`}
                      </p>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#d9e7c2]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#4e6f2a,#6d8a3a)] transition-all duration-500"
                          style={{ width: `${freeGiftProgress.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--ink-600)]">
                        Llevas {formatCurrencyAmount(freeGiftProgress.paidSubtotal, pricingCurrencyCode)} de{" "}
                        {formatCurrencyAmount(FREE_GIFT_MIN_SUBTOTAL ?? 0, pricingCurrencyCode)}.
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2 rounded-2xl border border-[#d7d7c3] bg-white/85 p-4 text-sm text-[var(--ink-700)]">
                    <p className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <strong className="text-[var(--ink-900)]">{totals.subtotal}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Impuestos estimados</span>
                      <strong className="text-[var(--ink-900)]">{totals.tax}</strong>
                    </p>
                    <p className="flex items-center justify-between text-base">
                      <span>Total estimado</span>
                      <strong className="text-[var(--ink-900)]">{totals.total}</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <label htmlFor="discount-code" className="sr-only">Código de descuento</label>
                      <Input
                        id="discount-code"
                        value={discountCode}
                        onChange={(event) => setDiscountCode(event.target.value)}
                        placeholder="Cupón"
                        disabled={isMutatingCart}
                      />
                    </div>
                    <Button variant="secondary" disabled={isMutatingCart || !discountCode.trim()} onClick={() => void applyDiscount()}>
                      Aplicar
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="gift-note" className="text-xs font-medium text-[var(--ink-700)]">
                      🎁 ¿Es un regalo? Agrega una nota (opcional)
                    </label>
                    <textarea
                      id="gift-note"
                      rows={2}
                      value={giftNote}
                      onChange={(event) => setGiftNote(event.target.value)}
                      placeholder="Ej: ¡Feliz cumpleaños! Esta figura es especial para ti."
                      className="w-full resize-none rounded-xl border border-[#d8d2b4] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-500)] outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      maxLength={280}
                    />
                    {giftNote.length > 0 ? (
                      <p className="text-right text-xs text-[var(--ink-600)]">{giftNote.length}/280</p>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-[#d4ddc2] bg-[#f3f8e7] p-4 text-sm text-[var(--ink-700)]">
                    <p className="font-semibold text-[var(--ink-900)]">Compra con confianza</p>
                    <div className="space-y-2">
                      {TRUST_PROMISES.map((promise) => {
                        const Icon = promise.icon;

                        return (
                          <div key={promise.title} className="rounded-xl border border-[#d2ddba] bg-white/70 p-3">
                            <p className="flex items-center gap-2 font-medium text-[var(--ink-900)]">
                              <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                              {promise.title}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-700)]">{promise.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="flex items-center gap-2 text-sm">
                      <LockClosedIcon className="h-4 w-4 text-[var(--brand-primary)]" />
                      No guardamos datos de tarjeta en DOFLINS.
                    </p>
                    <a
                      className="inline-flex items-center gap-2 font-medium text-[var(--ink-900)] underline underline-offset-2"
                      href={SUPPORT_WHATSAPP_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-[var(--brand-primary)]" />
                      Hablar con soporte por WhatsApp
                    </a>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-[#d7d7c3] bg-white/85 p-4">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Preguntas rápidas antes de pagar</p>
                    <div className="space-y-2">
                      {SHOPPING_FAQ_ITEMS.map((faq) => (
                        <details key={faq.question} className="rounded-xl border border-[#dbdcc9] bg-white px-3 py-2 text-sm">
                          <summary className="cursor-pointer font-medium text-[var(--ink-900)]">{faq.question}</summary>
                          <p className="pt-2 text-[var(--ink-700)]">{faq.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>

                  {cartRecoveryLinks ? (
                    <div className="space-y-3 rounded-2xl border border-[#d7d7c3] bg-white/85 p-4">
                      <p className="text-sm font-semibold text-[var(--ink-900)]">Recupera tu carrito cuando quieras</p>
                      <p className="text-sm text-[var(--ink-700)]">Si pausas la compra, guárdalo y retómalo después desde tu enlace.</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button asChild size="sm" variant="secondary" className="h-10">
                          <a href={cartRecoveryLinks.whatsapp} rel="noreferrer" target="_blank">
                            <ChatBubbleLeftRightIcon className="h-4 w-4" /> WhatsApp
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="secondary" className="h-10">
                          <a href={cartRecoveryLinks.email}>
                            <EnvelopeIcon className="h-4 w-4" /> Email
                          </a>
                        </Button>
                        <Button size="sm" variant="secondary" className="h-10" onClick={() => void copyRecoveryLink()}>
                          <ClipboardDocumentIcon className="h-4 w-4" /> Copiar link
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-[#d8d2b3] bg-[linear-gradient(180deg,#fafbea,#f1f6e2)] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-[var(--ink-700)]">
                    <span>Total estimado</span>
                    <strong className="text-base text-[var(--ink-900)]">{totals.total}</strong>
                  </div>
                  <Button className="h-12 w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" disabled={isMutatingCart || !cart?.lines.length} onClick={() => void goToCheckout()}>
                    {isMutatingCart ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ShoppingCartIcon className="h-5 w-5" />}
                    Pagar en Shopify
                  </Button>
                  {cart?.checkoutUrl && (
                    <div className="mt-2 space-y-1">
                      <button
                        onClick={() => setShowCartQR((v) => !v)}
                        className="w-full rounded-xl border border-[#d8d2b4] bg-white/70 py-2 text-xs font-medium text-[var(--ink-700)] hover:bg-[#f4f6e8] transition flex items-center justify-center gap-1.5"
                      >
                        <span>📲</span>
                        {showCartQR ? "Ocultar QR" : "Ver QR del carrito"}
                      </button>
                      {showCartQR && (
                        <div className="flex justify-center py-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(cart.checkoutUrl)}`}
                            alt="QR del carrito"
                            width={160}
                            height={160}
                            className="rounded-xl border border-[#d8d2b4]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--ink-700)]">
                    <LockClosedIcon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    Pago protegido en Shopify Checkout
                  </p>
                </div>
              </SheetContent>
            </Sheet>

            {/* ── Embedded Shopify Checkout ── */}

          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-[#d7d2b4] bg-white/75 p-1 shadow-[0_6px_14px_rgba(44,47,23,0.08)]">
              <Button
                size="sm"
                className={activeUniverse === "animals" ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : "shadow-none"}
                variant={activeUniverse === "animals" ? "primary" : "ghost"}
                onClick={() => { setActiveUniverse("animals"); setGridAnimKey((k) => k + 1); setShopSearch(""); }}
              >
                <SparklesIcon className="h-4 w-4" /> Animals
              </Button>
              <Button
                size="sm"
                className={activeUniverse === "multiverse" ? "bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] text-white" : "shadow-none"}
                variant={activeUniverse === "multiverse" ? "primary" : "ghost"}
                onClick={() => { setActiveUniverse("multiverse"); setGridAnimKey((k) => k + 1); setShopSearch(""); }}
              >
                <BoltIcon className="h-4 w-4" /> Multiverse
              </Button>
            </div>

          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="shop-search" className="sr-only">Buscar pack</label>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
              <Input
                id="shop-search"
                value={shopSearch}
                onChange={(event) => setShopSearch(event.target.value)}
                placeholder="Buscar pack…"
                className="h-10 pl-9"
              />
            </div>
            {wishlist.size > 0 ? (
              <button
                type="button"
                aria-pressed={showWishlistOnly}
                title={showWishlistOnly ? "Mostrar todos" : `Ver ${wishlist.size} favorito${wishlist.size === 1 ? "" : "s"}`}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                  showWishlistOnly
                    ? "border-red-400 bg-red-50 text-red-500"
                    : "border-[#d8d2b4] bg-white/90 text-[var(--ink-500)] hover:text-red-400"
                }`}
                onClick={() => setShowWishlistOnly((v) => !v)}
              >
                <HeartIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex gap-1 rounded-full border border-[#d7d2b4] bg-white/75 p-1 text-xs shadow-sm">
                {(["default", "new", "asc", "desc"] as const).map((order) => {
                  const labels: Record<typeof order, string> = { default: "Todos", new: "Nuevos", asc: "Menor precio", desc: "Mayor precio" };
                  return (
                    <button
                      key={order}
                      type="button"
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        sortOrder === order
                          ? "bg-[var(--brand-primary)] text-white shadow-sm"
                          : "text-[#445538] hover:bg-black/[0.05]"
                      }`}
                      onClick={() => setSortOrder(order)}
                    >
                      {labels[order]}
                    </button>
                  );
                })}
              </div>
              <div className="inline-flex rounded-full border border-[#d7d2b4] bg-white/75 p-1">
                <button
                  type="button"
                  aria-label="Vista grilla"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                    gridView === "grid" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--ink-700)] hover:bg-black/[0.05]"
                  }`}
                  onClick={() => setGridView("grid")}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Vista lista"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                    gridView === "list" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--ink-700)] hover:bg-black/[0.05]"
                  }`}
                  onClick={() => setGridView("list")}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e2c3] bg-white/80 px-3 py-1.5 text-xs text-[#445538]">
                <TruckIcon className="h-3.5 w-3.5 text-[#4e6f2a]" />
                <span><strong className="font-semibold">Envío nacional</strong> · 2-6 días hábiles</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e2c3] bg-white/80 px-3 py-1.5 text-xs text-[#445538]">
                <ClockIcon className="h-3.5 w-3.5 text-[#4e6f2a]" />
                <span><strong className="font-semibold">Preparación</strong> · 24-48 horas</span>
              </span>
              <a
                href={SUPPORT_WHATSAPP_URL}
                rel="noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e2c3] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#2c5e1e] transition hover:bg-[#eef8df] hover:border-[#b5d48a]"
              >
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" /> Soporte WhatsApp
              </a>
            </div>
          </div>

          {feedbackMessage ? (
            <p
              aria-live="polite"
              className={`rounded-2xl border px-4 py-2 text-sm ${
                /agregado|aplicado/i.test(feedbackMessage)
                  ? "border-[#bed6a6] bg-[#eef8df] text-[#2d5b1e]"
                  : "border-[#e7c7c7] bg-[#fff3f3] text-[#7b2e2e]"
              }`}
            >
              {feedbackMessage}
            </p>
          ) : null}

          {productsError ? (
            <div className="rounded-2xl border border-[#efc5c5] bg-[#fff1f1] px-4 py-3 text-sm text-[#7b2e2e]">
              <p className="font-medium">
                <ExclamationTriangleIcon className="mr-1 inline h-4 w-4" />
                {productsError}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" className="h-10 touch-manipulation" onClick={retryProductsLoad}>
                  <ArrowPathIcon className="h-4 w-4" /> Reintentar
                </Button>
                <Button asChild size="sm" className="h-10 bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
                  <a href={SUPPORT_WHATSAPP_URL} rel="noreferrer" target="_blank">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" /> Ir a WhatsApp
                  </a>
                </Button>
              </div>
              {productsErrorCode ? <p className="mt-2 text-xs text-[#8f4949]">Código: {productsErrorCode}</p> : null}
            </div>
          ) : null}

          {isLoadingProducts ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--ink-700)]">Cargando catálogo de {UNIVERSE_LABELS[activeUniverse]}...</p>
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-[#d9d2b7] bg-white/80 p-4">
                    <div className="h-36 animate-pulse rounded-xl bg-[#ebecd9]" />
                    <div className="mt-3 h-3 w-16 animate-pulse rounded bg-[#e2e4cf]" />
                    <div className="mt-2 h-7 w-4/5 animate-pulse rounded bg-[#dfe2cb]" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-[#e6e8d3]" />
                    <div className="mt-3 h-12 animate-pulse rounded-full bg-[#d9dec0]" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!isLoadingProducts && !productsError && !products.length ? (
            <div className="rounded-2xl border border-[#d8d3b2] bg-white/82 p-5">
              <p className="font-semibold text-[var(--ink-900)]">No hay packs visibles para {UNIVERSE_LABELS[activeUniverse]}.</p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">Estamos preparando nuevos packs para este universo. Vuelve en unos minutos.</p>
            </div>
          ) : null}

          {!isLoadingProducts && !productsError && filteredProducts.length === 0 && (shopSearch.trim() || showWishlistOnly) ? (
            <div className="rounded-2xl border border-[#d8d3b2] bg-white/82 p-5 text-center">
              <p className="font-semibold text-[var(--ink-900)]">
                {showWishlistOnly ? "No hay favoritos en este universo." : `Sin resultados para \u201c${shopSearch}\u201d`}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">
                {showWishlistOnly ? "Guarda packs con el corazón para verlos aquí." : "Prueba con otro término de búsqueda."}
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setShopSearch(""); setShowWishlistOnly(false); }}>
                Mostrar todos
              </Button>
            </div>
          ) : null}

          {!isLoadingProducts ? (
            <div
              key={gridAnimKey}
              className={gridView === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}
              style={{ animation: "catalog-fadein 0.35s ease" }}
            >
              {filteredProducts.map((product) => {
                const selectedVariant = getSelectedVariant(product);
                const isSoldOut = !selectedVariant?.availableForSale;
                const isLiveNew = liveNewProducts[activeUniverse].includes(product.id);
                const isBestSeller = BEST_SELLER_HANDLES.has(product.handle.toLowerCase());
                const stockBadge = resolveStockBadge(selectedVariant);

                const isJustAdded = lastAddedProductId === product.id;
                const isUltraLowStock =
                  typeof selectedVariant?.quantityAvailable === "number" &&
                  selectedVariant.quantityAvailable > 0 &&
                  selectedVariant.quantityAvailable <= 2;
                const rarityTag = product.tags.find((t) =>
                  /legendary|legendari|epic|rare|especial|uncommon/i.test(t)
                );

                return (
                  <LazyCard
                    key={product.id}
                    skeleton={
                      <div className="overflow-hidden rounded-3xl border border-[#d8d1b1] bg-white/60">
                        <div className="aspect-[16/11] w-full animate-pulse bg-[#ebecd9]" />
                        <div className="p-5 space-y-3">
                          <div className="h-3 w-16 animate-pulse rounded bg-[#e2e4cf]" />
                          <div className="h-7 w-4/5 animate-pulse rounded bg-[#dfe2cb]" />
                          <div className="h-12 animate-pulse rounded-full bg-[#d9dec0]" />
                        </div>
                      </div>
                    }
                  >
                    <article
                    className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#d8d1b1] bg-[linear-gradient(160deg,#ffffff,#f4f6e7)] shadow-[0_12px_24px_rgba(72,73,35,0.11)] transition hover:-translate-y-1.5 hover:shadow-[0_20px_34px_rgba(72,73,35,0.17)] ${gridView === "list" ? "md:flex-row" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalle rápido de ${product.title}`}
                    onClick={() => setSelectedProduct(product)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedProduct(product);
                      }
                    }}
                    >
                    <div className={`relative overflow-hidden bg-[linear-gradient(140deg,#f4f5e8,#e4ecd9)] ${
                        gridView === "list" ? "aspect-square w-32 shrink-0 md:aspect-auto md:h-full" : "aspect-[16/11] w-full"
                      }`}>
                      {isLiveNew || isBestSeller ? (
                        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
                          {isBestSeller ? (
                            <span className="inline-flex rounded-full bg-[#ffe9b5] px-3 py-1 text-xs font-bold text-[#5e4300] ring-1 ring-[#e6c676]">
                              <SparklesIcon className="mr-1 h-3.5 w-3.5" />
                              Más vendido
                            </span>
                          ) : null}
                          {isLiveNew ? (
                            <span className="inline-flex rounded-full bg-[#e8f5d8] px-3 py-1 text-xs font-bold text-[#2f5c1f] ring-1 ring-[#bfd89b]">
                              Nuevo
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.imageAlt ?? product.title}
                          fill
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          unoptimized
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-[var(--ink-600)]">
                          <PhotoIcon className="h-6 w-6" />
                          Sin imagen
                        </div>
                      )}
                      <div className="absolute right-3 top-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${stockBadge.className} ${
                            isUltraLowStock ? "animate-pulse" : ""
                          }`}
                        >
                          {stockBadge.label}
                        </span>
                      </div>
                      {/* ✓ Agregado badge inline */}
                      {isJustAdded ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                          <span className="animate-card-pop flex items-center gap-2 rounded-full bg-[#4e6f2a] px-4 py-2 text-sm font-bold text-white shadow-lg">
                            <CheckCircleIcon className="h-5 w-5" /> Agregado al carrito
                          </span>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        aria-label={wishlist.has(product.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                        className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/10 transition hover:scale-110 active:scale-95"
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      >
                        <HeartIcon className={`h-4 w-4 transition ${wishlist.has(product.id) ? "text-red-500" : "text-[var(--ink-400)]"}`} />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col space-y-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-700)]">{UNIVERSE_LABELS[activeUniverse]}</p>
                        <div className="flex items-center gap-1.5">
                          {rarityTag ? (
                            <span className="rounded-full bg-[#fdf3df] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#7a4a10] ring-1 ring-[#e6c676]">
                              {/legendary|legendari/i.test(rarityTag) ? "✨ Legendaria" : /epic/i.test(rarityTag) ? "🔥 Épica" : "💚 Especial"}
                            </span>
                          ) : null}
                          {isBestSeller ? (
                            <span className="rounded-full bg-[#ffe9b5] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#5e4300] ring-1 ring-[#e6c676]">
                              Top ventas
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-[var(--ink-700)] ring-1 ring-black/10">
                            {product.variants.length} variante{product.variants.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-title text-2xl leading-tight text-[var(--ink-900)] sm:text-[2rem]">{product.title}</h4>
                      <p className="min-h-[3rem] text-sm leading-relaxed text-[var(--ink-700)]">{getProductDescription(product, activeUniverse)}</p>

                      <div className="mt-auto space-y-3">
                        <div className="rounded-2xl border border-[#d8d2b4] bg-white/90 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-600)]">Precio</p>
                          <p className="font-title text-[2rem] leading-none text-[var(--ink-900)]">{formatMoney(selectedVariant?.price ?? product.price)}</p>
                        </div>

                        {product.variants.length > 1 ? (
                          <div
                            className="flex flex-wrap gap-1.5"
                            role="group"
                            aria-label="Seleccionar variante"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            {product.variants.map((variant) => (
                              <button
                                key={variant.id}
                                type="button"
                                aria-pressed={selectedVariant?.id === variant.id}
                                aria-label={`Variante ${variant.title}${!variant.availableForSale ? ", agotado" : ""}`}
                                disabled={!variant.availableForSale}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                  selectedVariant?.id === variant.id
                                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                                    : variant.availableForSale
                                      ? "border-[#d8d2b4] bg-white/90 text-[var(--ink-800)] hover:border-[var(--brand-primary)]"
                                      : "cursor-not-allowed border-[#ddd9d0] bg-[#f5f4ef] text-[var(--ink-500)] line-through"
                                }`}
                                onClick={() =>
                                  setSelectedVariantByProduct((previous) => ({
                                    ...previous,
                                    [product.id]: variant.id,
                                  }))
                                }
                              >
                                {variant.title}
                                {typeof variant.quantityAvailable === "number" &&
                                variant.quantityAvailable <= LOW_STOCK_THRESHOLD &&
                                variant.availableForSale
                                  ? ` (${variant.quantityAvailable})`
                                  : ""}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {stockBadge.detail ? <p className="text-xs font-medium text-[var(--ink-700)]">{stockBadge.detail}</p> : null}

                        {/* ── Acción principal: qty + agregar ── */}
                        <div className="relative">
                          {confettiByProduct.has(product.id) ?
                            ([
                              { tx: "-22px", rot: "-28deg", color: "#6d8a3a" },
                              { tx: "-8px",  rot: "18deg",  color: "#ffe9b5" },
                              { tx:  "8px",  rot: "54deg",  color: "#4e6f2a" },
                              { tx:  "22px", rot: "-52deg", color: "#bfd89b" },
                              { tx:  "0px",  rot: "88deg",  color: "#e6c676" },
                            ] as const).map((dot, i) => (
                              <span
                                key={i}
                                className="confetti-dot pointer-events-none absolute bottom-8 left-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
                                aria-hidden
                                style={{
                                  background: dot.color,
                                  "--tx": dot.tx,
                                  "--rot": dot.rot,
                                  animationDelay: `${i * 35}ms`,
                                } as React.CSSProperties}
                              />
                            ))
                          : null}
                          {isSoldOut ? (
                            <Button
                              className="h-12 w-full bg-[#c3cfb0] text-white"
                              disabled
                            >
                              <ShoppingCartIcon className="h-5 w-5" /> Agotado
                            </Button>
                          ) : (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {/* Stepper compacto */}
                              <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#d8d2b4] bg-white/90 px-2 py-1.5">
                                <button
                                  type="button"
                                  aria-label="Reducir cantidad"
                                  disabled={getProductQty(product.id) <= 1}
                                  onClick={(e) => { e.stopPropagation(); setProductQty(product.id, getProductQty(product.id) - 1); }}
                                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-black/[0.07] disabled:opacity-30"
                                >
                                  <MinusIcon className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-[1.25rem] text-center text-sm font-bold text-[var(--ink-900)]">{getProductQty(product.id)}</span>
                                <button
                                  type="button"
                                  aria-label="Aumentar cantidad"
                                  onClick={(e) => { e.stopPropagation(); setProductQty(product.id, getProductQty(product.id) + 1); }}
                                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-black/[0.07]"
                                >
                                  <PlusIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {/* CTA principal */}
                              <Button
                                className={`h-12 flex-1 text-base font-bold bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] ${lastAddedProductId === product.id ? "animate-card-pop" : ""}`}
                                disabled={isMutatingCart}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void addToCart(product, getProductQty(product.id));
                                }}
                              >
                                <ShoppingCartIcon className="h-5 w-5" />
                                Agregar&nbsp;×{getProductQty(product.id)}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* ── Acciones secundarias (discretas) ── */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/shop/${product.handle}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium text-[var(--ink-600)] transition hover:bg-black/[0.05] hover:text-[var(--ink-900)]"
                          >
                            <EyeIcon className="h-3.5 w-3.5" /> Ver detalle
                          </Link>
                          <span className="h-4 w-px bg-[#d8d2b4]" />
                          <button
                            type="button"
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium text-[var(--ink-600)] transition hover:bg-black/[0.05] hover:text-[var(--ink-900)]"
                            onClick={() => {
                              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${product.handle}`;
                              if (
                                typeof navigator !== "undefined" &&
                                typeof (navigator as unknown as Record<string, unknown>)["share"] === "function"
                              ) {
                                void (navigator as unknown as { share: (d: { title: string; url: string }) => Promise<void> }).share({
                                  title: product.title,
                                  url,
                                });
                              } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                                void navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado"));
                              }
                            }}
                          >
                            <ShareIcon className="h-3.5 w-3.5" /> Compartir
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                  </LazyCard>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* FAB carrito flotante — solo mobile cuando hay items */}
      {cartItemCount > 0 ? (
        <div
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+9rem)] right-4 z-40 flex flex-col items-end gap-2 sm:bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] lg:hidden"
          onMouseEnter={() => setIsFabHovered(true)}
          onMouseLeave={() => setIsFabHovered(false)}
          onFocus={() => setIsFabHovered(true)}
          onBlur={() => setIsFabHovered(false)}
        >
          {/* Mini carrito en hover */}
          {isFabHovered && cart?.lines.length ? (
            <div className="w-64 rounded-2xl border border-[#d7d7c3] bg-white p-3 shadow-[0_8px_24px_rgba(44,47,23,0.18)] animate-catalog-fadein">
              <p className="mb-2 text-xs font-semibold text-[var(--ink-900)]">En tu carrito</p>
              {cart.lines.slice(-2).map((line) => (
                <div key={line.id} className="flex items-center gap-2 py-1">
                  {line.imageUrl ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#ddd9c5] bg-[#f1f2e6]">
                      <Image src={line.imageUrl} alt={line.productTitle} fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--ink-900)]">{line.productTitle}</p>
                    <p className="text-xs text-[var(--ink-600)]">×{line.quantity} · {formatMoney(line.lineTotal)}</p>
                  </div>
                </div>
              ))}
              {cart.lines.length > 2 ? (
                <p className="mt-1 text-xs text-[var(--ink-600)]">…y {cart.lines.length - 2} más</p>
              ) : null}
              <div className="mt-2 border-t border-[#e8e8d8] pt-2 text-xs">
                <p className="flex justify-between text-[var(--ink-700)]">
                  <span>Total estimado</span>
                  <strong className="text-[var(--ink-900)]">{totals.total}</strong>
                </p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            aria-label={`Abrir carrito — ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}`}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white shadow-[0_8px_24px_rgba(50,80,25,0.42)] transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </span>
          </button>
        </div>
      ) : null}

      {stickyProduct && stickyVariant ? (
        <div className="fixed inset-x-0 bottom-14 z-40 px-3 pb-1.5 sm:bottom-0 sm:pb-[calc(env(safe-area-inset-bottom)+0.65rem)] lg:hidden">
          <div className="ink-light mx-auto w-full max-w-3xl rounded-2xl border border-[#d0c79f] bg-[linear-gradient(160deg,#fffef9,#eef4df)] p-3 shadow-[0_-10px_30px_rgba(51,57,26,0.26)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Pack recomendado</p>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">{stickyProduct.title}</p>
                </div>
                <p className="font-title text-2xl leading-none text-[var(--ink-900)]">{formatMoney(stickyVariant.price)}</p>
              </div>

              {freeGiftProgress.enabled ? (
                <div className="space-y-1.5 rounded-xl border border-[#d7e2bc] bg-[#f4fae8] p-2.5">
                  <p className="text-xs font-medium text-[var(--ink-700)]">
                    {freeGiftProgress.unlocked
                      ? "Regalo gratis desbloqueado"
                      : `Te faltan ${formatCurrencyAmount(freeGiftProgress.remaining, pricingCurrencyCode)} para tu regalo`}
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-[#d9e7c2]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#4e6f2a,#6d8a3a)] transition-all duration-500"
                      style={{ width: `${freeGiftProgress.percent}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <Button
                className={`h-11 w-full touch-manipulation ${
                  stickyVariant.availableForSale ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : "bg-[#c3cfb0] text-white"
                }`}
                disabled={stickyCtaDisabled}
                onClick={() => void addToCart(stickyProduct, 1)}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {stickyVariant.availableForSale ? "Agregar al carrito" : "Agotado"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent className="w-[min(94vw,920px)] gap-0 overflow-hidden p-0">
          {selectedProduct ? (
            <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
              {/* LEFT: image panel */}
              <div className="relative flex min-h-[320px] items-center justify-center bg-[linear-gradient(150deg,#f4f6e8,#e7eddc)] p-4 sm:p-6">
                {selectedProduct.imageUrl ? (
                  <div className="relative h-[280px] w-full overflow-hidden rounded-2xl shadow-[0_14px_30px_rgba(33,38,22,0.18)] sm:h-[340px]">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.imageAlt ?? selectedProduct.title}
                      fill
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover transition duration-300"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm text-[var(--ink-600)]">
                    <PhotoIcon className="h-7 w-7" /> Sin imagen disponible
                  </div>
                )}
                <span
                  className={`absolute right-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${selectedModalStock.className}`}
                >
                  {selectedModalStock.label}
                </span>
              </div>
              {/* RIGHT: flex-col with scrollable body + sticky footer */}
              <div className="flex max-h-[80vh] flex-col overflow-hidden">
                {/* Scrollable content */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  <DialogHeader>
                    <DialogTitle>{selectedProduct.title}</DialogTitle>
                    <DialogDescription>
                      {getProductDescription(selectedProduct, activeUniverse)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      className="rounded-full border-0 px-3 py-0.5 font-semibold"
                      style={{ background: activeUniverse === "animals" ? "#4e6f2a" : "#4a3c8c", color: "#fff" }}
                    >
                      {UNIVERSE_LABELS[activeUniverse]}
                    </Badge>
                    <Badge className="rounded-full px-3 py-0.5 border border-[var(--surface-300)]">
                      {selectedProduct.variants.length} variante(s)
                    </Badge>
                    <Badge
                      className={`rounded-full px-3 py-0.5 ${selectedModalSoldOut ? "border border-red-300 text-red-600 bg-transparent" : "border border-green-300 text-green-700 bg-transparent"}`}
                    >
                      {selectedModalSoldOut ? "Sin stock" : "En stock"}
                    </Badge>
                    {selectedModalStock.detail ? (
                      <Badge className="rounded-full px-3 py-0.5 text-amber-700 border border-amber-300 bg-transparent">
                        {selectedModalStock.detail}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-[#d8d2b4] bg-[linear-gradient(145deg,#ffffff,#f4f6e8)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-600)]">Precio</p>
                    <p className="font-title text-3xl text-[var(--ink-900)]">
                      {formatMoney(selectedModalVariant?.price ?? selectedProduct.price)}
                    </p>
                  </div>
                  {selectedProduct.variants.length > 1 ? (
                    <select
                      className="h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm text-[var(--ink-900)] outline-none"
                      value={selectedModalVariant?.id ?? ""}
                      onChange={(event) =>
                        setSelectedVariantByProduct((prev) => ({
                          ...prev,
                          [selectedProduct.id]: event.target.value,
                        }))
                      }
                    >
                      {selectedProduct.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title}{" "}
                          {variant.availableForSale
                            ? typeof variant.quantityAvailable === "number"
                              ? `(${variant.quantityAvailable} disp.)`
                              : ""
                            : "(Agotado)"}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {/* Qty stepper */}
                  <div className="flex items-center justify-between gap-2 rounded-full border border-[#d8d2b4] bg-white/90 px-3 py-1">
                    <button
                      type="button"
                      aria-label="Reducir cantidad"
                      disabled={getProductQty(selectedProduct.id) <= 1}
                      onClick={() =>
                        setProductQty(selectedProduct.id, getProductQty(selectedProduct.id) - 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-black/[0.07] disabled:opacity-30"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold text-[var(--ink-900)]">
                      {getProductQty(selectedProduct.id)}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar cantidad"
                      onClick={() =>
                        setProductQty(selectedProduct.id, getProductQty(selectedProduct.id) + 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-black/[0.07]"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/shop/${selectedProduct.handle}`}>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" /> Ver página completa
                    </Link>
                  </Button>
                </div>
                {/* Sticky footer */}
                <div className="shrink-0 border-t border-[#d8d2b4] bg-white p-4">
                  <Button
                    className={`w-full ${selectedModalSoldOut ? "bg-[#b9c8a3] text-white" : "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white hover:opacity-90"}`}
                    disabled={isMutatingCart || selectedModalSoldOut}
                    onClick={() => {
                      void addToCart(selectedProduct, getProductQty(selectedProduct.id));
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCartIcon className="h-5 w-5" />{" "}
                    {selectedModalSoldOut
                      ? "Agotado"
                      : `Agregar ×${getProductQty(selectedProduct.id)}`}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
