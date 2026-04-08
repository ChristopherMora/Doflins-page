"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { broadcastUniverse, onUniverseChange } from "@/lib/universe-store";

import type {
  ApiError,
  CartResponse,
  CartTotals,
  CollectionItemDTO,
  CollectionResponse,
  FreeGiftProgress,
  ProductsResponse,
  ShopCart,
  ShopProduct,
  ShopProductVariant,
  ShopVisualTheme,
  SortOrder,
  GridView,
  UniverseFilter,
  Universe,
} from "./shop-types";
import {
  BEST_SELLER_HANDLES,
  DROP_TIER_ORDER,
  FREE_GIFT_MIN_SUBTOTAL,
  LIVE_REFRESH_MS,
  PROMO_EXPIRES_ENV,
  QTY_HISTORY_KEY,
  UNIVERSE_LABELS,
  WISHLIST_KEY,
} from "./shop-constants";
import { SHOP_VISUAL_THEMES } from "./shop-themes";
import {
  clearCartSnapshot,
  formatCollectionPreviewName,
  formatMoney,
  parseApiResponse,
  pickDefaultVariant,
  readCartSnapshot,
  resolveStockBadge,
  toDropTier,
  toUniverseFromSeries,
  writeCartSnapshot,
} from "./shop-utils";

export function useShopExperience() {
  const [activeUniverse, setActiveUniverse] = useState<UniverseFilter>("animals");
  const [visualUniverse, setVisualUniverse] = useState<Universe>("neutral");

  // Pre-filtrar universo desde ?universe= y escuchar cambios globales de universo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("universe");
    if (u === "animals" || u === "multiverse" || u === "mega") {
      setActiveUniverse(u);
      setVisualUniverse(u);
    } else {
      setVisualUniverse("neutral");
    }

    return onUniverseChange((nextUniverse) => {
      setVisualUniverse(nextUniverse);
      if (nextUniverse === "animals" || nextUniverse === "multiverse" || nextUniverse === "mega") {
        setActiveUniverse(nextUniverse);
        setGridAnimKey((current) => current + 1);
        setShopSearch("");
      }
    });
  }, []);

  // Auto-aplicar código de referido desde ?ref= en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref")?.trim().toUpperCase();
    if (!refCode) return;
    localStorage.setItem("doflins_pending_ref", refCode);
  }, []);

  // Broadcast visual universe so header/home stay in sync
  useEffect(() => {
    broadcastUniverse(visualUniverse);
  }, [visualUniverse]);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [collectionByUniverse, setCollectionByUniverse] = useState<Record<UniverseFilter, CollectionItemDTO[]>>({
    animals: [],
    multiverse: [],
    mega: [],
  });
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [liveNewProducts, setLiveNewProducts] = useState<Record<UniverseFilter, string[]>>({
    animals: [],
    multiverse: [],
    mega: [],
  });
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const [, setDiscountCode] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isMutatingCart, setIsMutatingCart] = useState(false);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [quantityByProduct, setQuantityByProduct] = useState<Record<string, number>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [confettiByProduct, setConfettiByProduct] = useState<Set<string>>(new Set());
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsErrorCode, setProductsErrorCode] = useState<string | null>(null);
  const [gridAnimKey, setGridAnimKey] = useState(0);
  const [brokenShowcaseIds, setBrokenShowcaseIds] = useState<Set<number>>(new Set());
  const [shopSearch, setShopSearch] = useState("");
  const [promoTimeLeft, setPromoTimeLeft] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [gridView, setGridView] = useState<GridView>("grid");
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [isFabHovered, setIsFabHovered] = useState(false);
  const [isLoadingCollectionPreview, setIsLoadingCollectionPreview] = useState(true);
  const [collectionPreviewError, setCollectionPreviewError] = useState(false);

  const knownProductIdsRef = useRef<Record<UniverseFilter, Set<string>>>({
    animals: new Set(),
    multiverse: new Set(),
    mega: new Set(),
  });
  const prevStockRef = useRef<Map<string, boolean>>(new Map());
  const liveRefreshInFlightRef = useRef(false);
  const snapshotRecoveryAttemptedRef = useRef(false);
  const comprasSectionRef = useRef<HTMLElement | null>(null);
  const cartRef = useRef<ShopCart | null>(null);

  // Mantener cartRef siempre sincronizado con el estado cart
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Cuando el carrito cargue, aplicar el código de referido pendiente (?ref= URL)
  useEffect(() => {
    const pending = localStorage.getItem("doflins_pending_ref");
    if (!pending || !cart) return;
    const alreadyApplied = cart.discountCodes.some(
      (d) => d.code.toUpperCase() === pending.toUpperCase() && d.applicable,
    );
    if (alreadyApplied) {
      localStorage.removeItem("doflins_pending_ref");
      return;
    }
    localStorage.removeItem("doflins_pending_ref");
    setDiscountCode(pending);
    fetch("/api/cart/discount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: pending }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { cart?: ShopCart; coupon?: { code: string; applied: boolean } };
        if (data.cart) setCart(data.cart);
        if (data.coupon?.applied) {
          toast.success(`Código de referido ${pending} aplicado 🎉`, { duration: 4000 });
        } else {
          toast.error(`El código ${pending} no pudo aplicarse al carrito.`);
        }
      })
      .catch(() => null);
  }, [cart]);

  // Keep Home neutral at top, but once user enters shop section switch to an active purchase theme.
  useEffect(() => {
    const section = comprasSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisualUniverse((previous) => (previous === "neutral" ? activeUniverse : previous));
        }
      },
      { threshold: 0.18, rootMargin: "-8% 0px -55% 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [activeUniverse]);

  const visualTheme: ShopVisualTheme = SHOP_VISUAL_THEMES[visualUniverse];
  const imageFilterStyle = useMemo(() => ({ filter: "var(--shop-image-filter)" }) as React.CSSProperties, []);
  const universeThemeVars = useMemo(
    () =>
      ({
        "--shop-shell-bg": visualTheme.shellBackground,
        "--shop-shell-border": visualTheme.shellBorder,
        "--shop-shell-shadow": visualTheme.shellShadow,
        "--shop-primary-from": visualTheme.primaryFrom,
        "--shop-primary-to": visualTheme.primaryTo,
        "--shop-chip-bg": visualTheme.chipBg,
        "--shop-chip-text": visualTheme.chipText,
        "--shop-chip-ring": visualTheme.chipRing,
        "--shop-promo-timer-bg": visualTheme.promoTimerBg,
        "--shop-promo-timer-text": visualTheme.promoTimerText,
        "--shop-support-hover-bg": visualTheme.supportChipHoverBg,
        "--shop-support-hover-border": visualTheme.supportChipHoverBorder,
        "--shop-image-panel-bg": visualTheme.imagePanelBg,
        "--shop-image-overlay": visualTheme.imageOverlay,
        "--shop-image-filter": visualTheme.imageFilter,
        "--shop-image-shadow": visualTheme.imageShadow,
        "--shop-added-badge-bg": visualTheme.addedBadgeBg,
        "--shop-modal-universe-badge-bg": visualTheme.modalUniverseBadgeBg,
        "--shop-card-bg": visualTheme.cardBg,
        "--shop-card-border": visualTheme.cardBorder,
        "--shop-card-shadow": visualTheme.cardShadow,
        "--shop-card-hover-shadow": visualTheme.cardHoverShadow,
        "--shop-control-bg": visualTheme.controlBg,
        "--shop-control-border": visualTheme.controlBorder,
        "--shop-skeleton-base": visualTheme.skeletonBase,
        "--shop-skeleton-hi": visualTheme.skeletonHighlight,
      }) as React.CSSProperties,
    [visualTheme],
  );

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
    if (snapshotRecoveryAttemptedRef.current) return null;
    snapshotRecoveryAttemptedRef.current = true;

    const snapshot = readCartSnapshot();
    if (!snapshot?.lines.length) return null;

    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: snapshot.lines }),
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
      const response = await fetch("/api/cart", { method: "GET", cache: "no-store" });
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
      options: { silent?: boolean; forceRealtime?: boolean } = {},
    ) => {
      const { silent = false, forceRealtime = false } = options;
      if (!silent) setIsLoadingProducts(true);

      const query = new URLSearchParams({ universe });
      if (forceRealtime) query.set("realtime", "1");
      if (!silent) {
        setProductsError(null);
        setProductsErrorCode(null);
      }

      try {
        const response = await fetch(`/api/shop/products?${query.toString()}`, { method: "GET", cache: "no-store" });
        const payload = await parseApiResponse<ProductsResponse>(response);

        const knownIds = knownProductIdsRef.current[universe];
        if (knownIds.size > 0) {
          const incomingNewIds = payload.products
            .map((p) => p.id)
            .filter((pid) => !knownIds.has(pid));
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

        for (const product of payload.products) knownIds.add(product.id);

        setProducts(payload.products);
        setProductsErrorCode(null);
        setSelectedVariantByProduct((previous) => {
          const next = { ...previous };
          for (const product of payload.products) {
            if (next[product.id]) continue;
            const defaultVariant = pickDefaultVariant(product);
            if (defaultVariant) next[product.id] = defaultVariant.id;
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
          setProducts([]);
        }
      } finally {
        if (!silent) setIsLoadingProducts(false);
      }
    },
    [],
  );

  useEffect(() => { void loadCart(); }, [loadCart]);

  const loadCollectionPreview = useCallback(async () => {
    setIsLoadingCollectionPreview(true);
    setCollectionPreviewError(false);
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch("/api/collection", { method: "GET", cache: "no-store" });
        const payload = await parseApiResponse<CollectionResponse>(response);

        const grouped: Record<UniverseFilter, CollectionItemDTO[]> = { animals: [], multiverse: [], mega: [] };
        for (const item of payload.collection) {
          if (!item.active) continue;
          const universe = toUniverseFromSeries(item.series);
          if (!universe) continue;
          grouped[universe].push(item);
        }
        setCollectionByUniverse(grouped);
        setIsLoadingCollectionPreview(false);
        return;
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    // All retries exhausted
    setCollectionPreviewError(true);
    setIsLoadingCollectionPreview(false);
  }, []);

  useEffect(() => { void loadCollectionPreview(); }, [loadCollectionPreview]);

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

  // Restock notifications
  useEffect(() => {
    const prev = prevStockRef.current;
    for (const product of products) {
      const nowAvailable = product.variants.some((v) => v.availableForSale);
      const wasAvailable = prev.get(product.id);
      if (wasAvailable === false && nowAvailable && wishlist.has(product.id)) {
        toast.success(`¡${product.title} volvió al stock!`, {
          duration: 7000,
          action: { label: "Ver", onClick: () => setSelectedProduct(product) },
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
        if (parsed && typeof parsed === "object") setQuantityByProduct(parsed);
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

  useEffect(() => { void loadProducts(activeUniverse); }, [activeUniverse, loadProducts]);

  useEffect(() => {
    const refreshCatalog = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (liveRefreshInFlightRef.current) return;
      liveRefreshInFlightRef.current = true;
      try { await loadProducts(activeUniverse, { silent: true, forceRealtime: true }); }
      finally { liveRefreshInFlightRef.current = false; }
    };
    const intervalId = window.setInterval(() => { void refreshCatalog(); }, LIVE_REFRESH_MS);
    const onWindowFocus = () => { void refreshCatalog(); };
    const onVisibilityChange = () => { if (!document.hidden) void refreshCatalog(); };
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeUniverse, loadProducts]);

  useEffect(() => {
    if (isLoadingCart) return;
    if (cart?.lines.length) { writeCartSnapshot(cart); return; }
    clearCartSnapshot();
  }, [cart, isLoadingCart]);

  const applyCartPayload = useCallback((nextCart: ShopCart) => {
    setCart(nextCart);
    window.dispatchEvent(new Event("doflins:cart-updated"));
    window.dispatchEvent(new Event("doflins:open-cart"));
  }, []);

  const getSelectedVariant = useCallback(
    (product: ShopProduct): ShopProductVariant | null => {
      const selectedId = selectedVariantByProduct[product.id];
      return product.variants.find((v) => v.id === selectedId) ?? pickDefaultVariant(product);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines: [{ merchandiseId: selectedVariant.id, quantity: normalizedQuantity }] }),
        });
        const payload = await parseApiResponse<CartResponse>(response);
        if (!payload.cart) throw new Error("No se pudo actualizar el carrito.");
        applyCartPayload(payload.cart);
        setLastAddedProductId(product.id);
        setTimeout(() => setLastAddedProductId(null), 700);
        setConfettiByProduct((prev) => new Set([...prev, product.id]));
        setTimeout(
          () => setConfettiByProduct((prev) => { const next = new Set(prev); next.delete(product.id); return next; }),
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



  const totals: CartTotals = useMemo(() => {
    if (!cart) return { subtotal: "-", total: "-", tax: "-" };
    return {
      subtotal: formatMoney(cart.subtotal),
      total: formatMoney(cart.total),
      tax: formatMoney(cart.totalTax),
    };
  }, [cart]);

  const freeGiftProgress: FreeGiftProgress = useMemo(() => {
    if (!FREE_GIFT_MIN_SUBTOTAL) {
      return { enabled: false, unlocked: false, paidSubtotal: 0, remaining: 0, percent: 0 };
    }
    const paidSubtotal = (cart?.lines ?? []).reduce((total, line) => {
      const unitAmount = Number(line.pricePerUnit.amount);
      const lineAmount = Number(line.lineTotal.amount);
      if (!Number.isFinite(unitAmount) || !Number.isFinite(lineAmount)) return total;
      if (unitAmount <= 0) return total;
      return total + lineAmount;
    }, 0);
    const unlocked = paidSubtotal >= FREE_GIFT_MIN_SUBTOTAL;
    const remaining = Math.max(0, FREE_GIFT_MIN_SUBTOTAL - paidSubtotal);
    const percent = Math.min(100, (paidSubtotal / FREE_GIFT_MIN_SUBTOTAL) * 100);
    return { enabled: true, unlocked, paidSubtotal, remaining, percent };
  }, [cart]);

  const stickyProduct = useMemo(() => {
    if (!products.length) return null;
    const bestSeller = products.find((p) => BEST_SELLER_HANDLES.has(p.handle.toLowerCase()) && getSelectedVariant(p)?.availableForSale);
    if (bestSeller) return bestSeller;
    return products.find((p) => getSelectedVariant(p)?.availableForSale) ?? products[0] ?? null;
  }, [getSelectedVariant, products]);

  const stickyVariant = stickyProduct ? getSelectedVariant(stickyProduct) : null;
  const stickyCtaDisabled = isMutatingCart || !stickyProduct || !stickyVariant?.availableForSale;
  const activeCatalogHref = `/reveal?universe=${activeUniverse}`;
  const quickBuyLabel = stickyProduct ? `Comprar ${stickyProduct.title}` : "Comprar pack recomendado";
  const addRecommendedPack = useCallback(() => {
    if (!stickyProduct) return;
    void addToCart(stickyProduct, 1);
  }, [addToCart, stickyProduct]);



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
      return [...products].sort((a, b) => (newSet.has(a.id) ? 0 : 1) - (newSet.has(b.id) ? 0 : 1));
    }
    if (sortOrder === "default") {
      return [...products].sort((a, b) => {
        const aBS = BEST_SELLER_HANDLES.has(a.handle.toLowerCase()) ? 0 : 1;
        const bBS = BEST_SELLER_HANDLES.has(b.handle.toLowerCase()) ? 0 : 1;
        return aBS - bBS;
      });
    }
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
    return base.filter((p) => p.title.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q));
  }, [sortedProducts, shopSearch, showWishlistOnly, wishlist]);

  const activeCollectionPreviewNames = useMemo(() => {
    const sortedItems = [...collectionByUniverse[activeUniverse]].sort((a, b) => {
      const tierA = DROP_TIER_ORDER.indexOf(toDropTier(a.rarity));
      const tierB = DROP_TIER_ORDER.indexOf(toDropTier(b.rarity));
      if (tierA !== tierB) return tierA - tierB;
      return a.collectionNumber - b.collectionNumber;
    });
    const seen = new Set<string>();
    const names: string[] = [];
    for (const item of sortedItems) {
      const next = formatCollectionPreviewName(item);
      if (!next || seen.has(next)) continue;
      seen.add(next);
      names.push(next);
    }
    return names;
  }, [activeUniverse, collectionByUniverse]);

  const activeCollectionPreviewHead = useMemo(
    () => activeCollectionPreviewNames.slice(0, 10),
    [activeCollectionPreviewNames],
  );
  const activeCollectionPreviewRemaining = Math.max(0, activeCollectionPreviewNames.length - activeCollectionPreviewHead.length);

  const activeCollectionShowcaseItems = useMemo(() => {
    const sortedItems = [...collectionByUniverse[activeUniverse]].sort((a, b) => {
      const tierA = DROP_TIER_ORDER.indexOf(toDropTier(a.rarity));
      const tierB = DROP_TIER_ORDER.indexOf(toDropTier(b.rarity));
      if (tierA !== tierB) return tierA - tierB;
      return a.collectionNumber - b.collectionNumber;
    });
    return sortedItems.slice(0, 12);
  }, [activeUniverse, collectionByUniverse]);

  const activeCollectionShowcaseRemaining = Math.max(
    0,
    collectionByUniverse[activeUniverse].length - activeCollectionShowcaseItems.length,
  );

  const selectedModalVariant = selectedProduct ? getSelectedVariant(selectedProduct) : null;
  const selectedModalSoldOut = !selectedModalVariant?.availableForSale;
  const selectedModalStock = resolveStockBadge(selectedModalVariant);

  const retryProductsLoad = useCallback(() => {
    void loadProducts(activeUniverse, { forceRealtime: true });
  }, [activeUniverse, loadProducts]);

  const activateUniverse = useCallback((nextUniverse: UniverseFilter) => {
    setActiveUniverse(nextUniverse);
    setVisualUniverse(nextUniverse);
    setGridAnimKey((current) => current + 1);
    setShopSearch("");
  }, []);

  return {
    // Universe
    activeUniverse,
    visualUniverse,
    visualTheme,
    imageFilterStyle,
    universeThemeVars,
    activateUniverse,
    activeCatalogHref,

    // Products
    products,
    filteredProducts,
    isLoadingProducts,
    productsError,
    productsErrorCode,
    retryProductsLoad,
    liveNewProducts,
    sortOrder,
    setSortOrder,
    gridView,
    setGridView,
    gridAnimKey,
    shopSearch,
    setShopSearch,

    // Cart
    cart,
    cartItemCount,
    isMutatingCart,
    addToCart,
    totals,
    setDiscountCode,
    freeGiftProgress,
    pricingCurrencyCode,

    // Product selection & variants
    selectedProduct,
    setSelectedProduct,
    selectedVariantByProduct,
    setSelectedVariantByProduct,
    getSelectedVariant,
    getProductQty,
    setProductQty,
    getLineQtyAvailable,
    selectedModalVariant,
    selectedModalSoldOut,
    selectedModalStock,

    // Sticky product
    stickyProduct,
    stickyVariant,
    stickyCtaDisabled,
    quickBuyLabel,
    addRecommendedPack,

    // Wishlist
    wishlist,
    toggleWishlist,
    showWishlistOnly,
    setShowWishlistOnly,

    // UI
    feedbackMessage,
    setFeedbackMessage,
    lastAddedProductId,
    confettiByProduct,
    brokenShowcaseIds,
    setBrokenShowcaseIds,
    promoTimeLeft,
    isFabHovered,
    setIsFabHovered,
    isLoadingCollectionPreview,
    collectionPreviewError,
    retryCollectionPreview: loadCollectionPreview,

    // Collection showcase
    collectionByUniverse,
    activeCollectionPreviewHead,
    activeCollectionPreviewRemaining,
    activeCollectionShowcaseItems,
    activeCollectionShowcaseRemaining,

    // Refs
    comprasSectionRef,
  };
}

export type ShopExperienceReturn = ReturnType<typeof useShopExperience>;
