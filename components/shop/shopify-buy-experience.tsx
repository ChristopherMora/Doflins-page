"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  LockClosedIcon,
  MinusIcon,
  PhotoIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

import type { ShopCart, ShopProduct, ShopProductVariant, ShopifyMoney, UniverseFilter } from "@/lib/shopify/types";
import { Badge } from "@/components/ui/badge";
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
const SUPPORT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL?.trim() ??
  "https://wa.me/?text=Hola%20equipo%20DOFLINS,%20necesito%20ayuda%20con%20mi%20compra.";
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

export function ShopifyBuyExperience(): React.JSX.Element {
  const [activeUniverse, setActiveUniverse] = useState<UniverseFilter>("animals");
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
  const [productsError, setProductsError] = useState<string | null>(null);
  const knownProductIdsRef = useRef<Record<UniverseFilter, Set<string>>>({
    animals: new Set(),
    multiverse: new Set(),
  });
  const liveRefreshInFlightRef = useRef(false);

  const cartItemCount = cart?.totalQuantity ?? 0;

  const loadCart = useCallback(async () => {
    setIsLoadingCart(true);
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await parseApiResponse<CartResponse>(response);
      setCart(payload.cart);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo cargar el carrito.");
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

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
        if (!silent) {
          setProductsError(error instanceof Error ? error.message : "No se pudieron cargar los productos.");
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
    async (product: ShopProduct) => {
      const selectedVariant = getSelectedVariant(product);
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
                quantity: 1,
              },
            ],
          }),
        });
        const payload = await parseApiResponse<CartResponse>(response);
        if (!payload.cart) {
          throw new Error("No se pudo actualizar el carrito.");
        }
        applyCartPayload(payload.cart);
        setFeedbackMessage(`${product.title} agregado al carrito.`);
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
    setIsMutatingCart(true);
    setFeedbackMessage(null);
    try {
      const response = await fetch("/api/cart/lines/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineIds: [lineId],
        }),
      });
      const payload = await parseApiResponse<CartResponse>(response);
      if (!payload.cart) {
        throw new Error("No se pudo actualizar el carrito.");
      }
      setCart(payload.cart);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo eliminar el item.");
    } finally {
      setIsMutatingCart(false);
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
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "No se pudo abrir checkout.");
      setIsMutatingCart(false);
    }
  }, []);

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
  const productsCountLabel = `${products.length} pack${products.length === 1 ? "" : "s"}`;
  const selectedModalVariant = selectedProduct ? getSelectedVariant(selectedProduct) : null;
  const selectedModalSoldOut = !selectedModalVariant?.availableForSale;
  const hasCartLines = Boolean(cart?.lines.length);

  return (
    <section id="compras" className="space-y-5 pb-28 lg:pb-6">
      <Card className="border border-[#d9cfa8] bg-[linear-gradient(145deg,#fffaf0,#f2f6e8)] shadow-[0_18px_36px_rgba(86,98,51,0.16)]">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <Badge className="w-fit bg-[#e8efd8] text-[var(--ink-900)]">
                <ShoppingCartIcon className="h-4 w-4" /> Shopify checkout
              </Badge>
              <h3 className="font-title text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">Compra tus packs DOFLINS</h3>
              <p className="max-w-2xl text-sm text-[var(--ink-700)] sm:text-base">
                Carrito en esta web y pago en Shopify seguro (sin guardar tarjeta en nuestro servidor).
              </p>
              {FREE_GIFT_PROMO_LABEL || FREE_GIFT_MIN_SUBTOTAL ? (
                <p className="inline-flex w-fit items-center rounded-full bg-[#e8f5d8] px-3 py-1 text-xs font-semibold text-[#2f5c1f] ring-1 ring-[#bfd89b]">
                  {FREE_GIFT_PROMO_LABEL || `Regalo gratis en compras desde ${formatCurrencyAmount(FREE_GIFT_MIN_SUBTOTAL ?? 0, pricingCurrencyCode)}`}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[var(--ink-700)] ring-1 ring-[#d6d2b4]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> {productsCountLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[var(--ink-700)] ring-1 ring-[#d6d2b4]">
                  Moneda {currencyCode}
                </span>
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
                    <SheetDescription>Revisa cantidades y continúa al checkout de Shopify.</SheetDescription>
                  </SheetHeader>

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
                          2. Checkout
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
                      <article key={line.id} className="rounded-2xl border border-[#d7d7c3] bg-white/85 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[var(--ink-900)]">{line.productTitle}</p>
                              {isFreeLine ? (
                                <span className="rounded-full bg-[#e8f5d8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#2f5c1f] ring-1 ring-[#bfd89b]">
                                  Gratis
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-[var(--ink-700)]">{line.variantTitle}</p>
                            <p className="mt-1 text-sm text-[var(--ink-700)]">{formatMoney(line.lineTotal)}</p>
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
                    <p className="pt-1 text-xs text-[var(--ink-600)]">
                      Sin cargos sorpresa: envío e impuestos finales se confirman según tu dirección en checkout.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value)}
                      placeholder="Cupón"
                      disabled={isMutatingCart}
                    />
                    <Button variant="secondary" disabled={isMutatingCart || !discountCode.trim()} onClick={() => void applyDiscount()}>
                      Aplicar
                    </Button>
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
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--ink-700)]">
                    <LockClosedIcon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    Pago protegido en Shopify Checkout
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-[#d7d2b4] bg-white/75 p-1 shadow-[0_6px_14px_rgba(44,47,23,0.08)]">
              <Button
                size="sm"
                className={activeUniverse === "animals" ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : "shadow-none"}
                variant={activeUniverse === "animals" ? "primary" : "ghost"}
                onClick={() => setActiveUniverse("animals")}
              >
                <SparklesIcon className="h-4 w-4" /> Animals
              </Button>
              <Button
                size="sm"
                className={activeUniverse === "multiverse" ? "bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] text-white" : "shadow-none"}
                variant={activeUniverse === "multiverse" ? "primary" : "ghost"}
                onClick={() => setActiveUniverse("multiverse")}
              >
                <BoltIcon className="h-4 w-4" /> Multiverse
              </Button>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-600)]">
              Catálogo activo: {UNIVERSE_LABELS[activeUniverse]}
            </p>
          </div>
          <p className="text-xs text-[var(--ink-600)]">Tip: toca una tarjeta para abrir vista rápida sin salir del catálogo.</p>

          {feedbackMessage ? (
            <p
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
            <p className="rounded-2xl border border-[#efc5c5] bg-[#fff1f1] px-4 py-2 text-sm text-[#7b2e2e]">
              <ExclamationTriangleIcon className="mr-1 inline h-4 w-4" />
              {productsError}
            </p>
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

          {!isLoadingProducts ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const selectedVariant = getSelectedVariant(product);
                const isSoldOut = !selectedVariant?.availableForSale;
                const isLiveNew = liveNewProducts[activeUniverse].includes(product.id);
                const isBestSeller = BEST_SELLER_HANDLES.has(product.handle.toLowerCase());

                return (
                  <article
                    key={product.id}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#d8d1b1] bg-[linear-gradient(160deg,#ffffff,#f4f6e7)] shadow-[0_12px_24px_rgba(72,73,35,0.11)] transition hover:-translate-y-1.5 hover:shadow-[0_20px_34px_rgba(72,73,35,0.17)]"
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
                    <div className="relative aspect-[16/11] w-full overflow-hidden bg-[linear-gradient(140deg,#f4f5e8,#e4ecd9)]">
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.imageAlt ?? product.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-[var(--ink-600)]">
                          <PhotoIcon className="h-6 w-6" />
                          Sin imagen
                        </div>
                      )}
                      <div className="absolute right-3 top-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            isSoldOut
                              ? "bg-[#e5d3d3] text-[#7a3a3a] ring-1 ring-[#d6b8b8]"
                              : "bg-[#dff0c7] text-[#2f5c1f] ring-1 ring-[#b7d494]"
                          }`}
                        >
                          {isSoldOut ? "Agotado" : "Disponible"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col space-y-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-700)]">{UNIVERSE_LABELS[activeUniverse]}</p>
                        <div className="flex items-center gap-1.5">
                          {isBestSeller ? (
                            <span className="rounded-full bg-[#ffe9b5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5e4300] ring-1 ring-[#e6c676]">
                              Top ventas
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[var(--ink-700)] ring-1 ring-black/10">
                            {product.variants.length} variante{product.variants.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-title text-2xl leading-tight text-[var(--ink-900)] sm:text-[2rem]">{product.title}</h4>
                      <p className="min-h-[3rem] text-sm leading-relaxed text-[var(--ink-700)]">{getProductDescription(product, activeUniverse)}</p>

                      <div className="mt-auto space-y-3">
                        <div className="rounded-2xl border border-[#d8d2b4] bg-white/90 p-3.5">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-600)]">Precio</p>
                          <p className="font-title text-[2rem] leading-none text-[var(--ink-900)]">{formatMoney(selectedVariant?.price ?? product.price)}</p>
                        </div>

                        {product.variants.length > 1 ? (
                          <select
                            className="h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm text-[var(--ink-900)] outline-none"
                            value={selectedVariant?.id ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              setSelectedVariantByProduct((previous) => ({
                                ...previous,
                                [product.id]: event.target.value,
                              }))
                            }
                          >
                            {product.variants.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.title} {variant.availableForSale ? "" : "(Agotado)"}
                              </option>
                            ))}
                          </select>
                        ) : null}

                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-10 w-full rounded-full border border-[#d8d2b4] bg-white/85 text-[var(--ink-800)] hover:bg-white"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link href={`/shop/${product.handle}`}>
                            <EyeIcon className="h-4 w-4" /> Ver detalle completo
                          </Link>
                        </Button>

                        <Button
                          className={`w-full ${isSoldOut ? "bg-[#c3cfb0] text-white" : "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"}`}
                          disabled={isMutatingCart || isSoldOut}
                          onClick={(event) => {
                            event.stopPropagation();
                            void addToCart(product);
                          }}
                        >
                          <ShoppingCartIcon className="h-5 w-5" />
                          {isSoldOut ? "Agotado" : "Agregar al carrito"}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {stickyProduct && stickyVariant ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] lg:hidden">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#d0c79f] bg-[linear-gradient(160deg,#fffef9,#eef4df)] p-3 shadow-[0_-10px_30px_rgba(51,57,26,0.26)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Pack recomendado</p>
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
                className={`h-11 w-full ${stickyVariant.availableForSale ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : "bg-[#c3cfb0] text-white"}`}
                disabled={stickyCtaDisabled}
                onClick={() => void addToCart(stickyProduct)}
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
              <div className="relative flex min-h-[320px] items-center justify-center bg-[linear-gradient(150deg,#f4f6e8,#e7eddc)] p-4 sm:p-6">
                {selectedProduct.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.imageAlt ?? selectedProduct.title}
                    className="h-full max-h-[360px] w-full object-contain drop-shadow-[0_20px_30px_rgba(33,38,22,0.22)]"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm text-[var(--ink-600)]">
                    <PhotoIcon className="h-7 w-7" />
                    Sin imagen disponible
                  </div>
                )}
                <span
                  className={`absolute right-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    selectedModalSoldOut
                      ? "bg-[#e5d3d3] text-[#7a3a3a] ring-1 ring-[#d6b8b8]"
                      : "bg-[#dff0c7] text-[#2f5c1f] ring-1 ring-[#b7d494]"
                  }`}
                >
                  {selectedModalSoldOut ? "Agotado" : "Disponible"}
                </span>
              </div>

              <div className="space-y-4 p-6">
                <DialogHeader>
                  <DialogTitle>{selectedProduct.title}</DialogTitle>
                  <DialogDescription>{getProductDescription(selectedProduct, activeUniverse)}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge className="bg-[#ecf3da] text-[var(--ink-700)]">{UNIVERSE_LABELS[activeUniverse]}</Badge>
                  <Badge className="bg-white text-[var(--ink-700)] ring-1 ring-black/10">
                    {selectedProduct.variants.length} variante{selectedProduct.variants.length === 1 ? "" : "s"}
                  </Badge>
                  <Badge className={selectedModalSoldOut ? "bg-[#f5e2e2] text-[#8a3f3f]" : "bg-[#e1f1cb] text-[#2d5c1f]"}>
                    {selectedModalSoldOut ? "Sin stock" : "En stock"}
                  </Badge>
                </div>

                <div className="rounded-2xl border border-[#d8d2b4] bg-[linear-gradient(145deg,#ffffff,#f4f6e8)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-600)]">Precio</p>
                  <p className="font-title text-3xl text-[var(--ink-900)]">{formatMoney(selectedModalVariant?.price ?? selectedProduct.price)}</p>
                </div>

                {selectedProduct.variants.length > 1 ? (
                  <select
                    className="h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm text-[var(--ink-900)] outline-none"
                    value={selectedModalVariant?.id ?? ""}
                    onChange={(event) =>
                      setSelectedVariantByProduct((previous) => ({
                        ...previous,
                        [selectedProduct.id]: event.target.value,
                      }))
                    }
                  >
                    {selectedProduct.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title} {variant.availableForSale ? "" : "(Agotado)"}
                      </option>
                    ))}
                  </select>
                ) : null}

                <div className="space-y-2">
                  <Button
                    className={`w-full ${selectedModalSoldOut ? "bg-[#b9c8a3] text-white" : "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"}`}
                    disabled={isMutatingCart || selectedModalSoldOut}
                    onClick={() => {
                      void addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCartIcon className="h-5 w-5" /> {selectedModalSoldOut ? "Agotado" : "Agregar al carrito"}
                  </Button>

                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/shop/${selectedProduct.handle}`}>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" /> Ver página completa
                    </Link>
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
