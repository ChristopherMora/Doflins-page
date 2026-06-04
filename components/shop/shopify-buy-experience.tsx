"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  HeartIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PhotoIcon,
  PlusIcon,
  ShoppingCartIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import { WatchingBadge } from "@/components/ui/watching-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


import {
  BEST_SELLER_HANDLES,
  BUNDLE_PROMO_CODE,
  DROP_TIER_LABELS,
  DROP_TIER_ORDER,
  DROP_TIER_PROBABILITY,
  FREE_GIFT_MIN_SUBTOTAL,
  FREE_GIFT_PROMO_LABEL,
  LOW_STOCK_THRESHOLD,
  SUPPORT_WHATSAPP_URL,
  UNIVERSE_LABELS,
  getPackTier,
} from "./shop-constants";
import {
  figureCountFromHandle,
  formatCollectionPreviewName,
  formatCurrencyAmount,
  formatMoney,
  getProductDescription,
  resolveStockBadge,
  toDropTier,
} from "./shop-utils";
import { ReviewsSection } from "./reviews-section";
import { useShopExperience } from "./use-shop-experience";
import { useShopAnalytics } from "@/lib/hooks/use-shop-analytics";
import { AbandonedCartReminder } from "./abandoned-cart-reminder";
import { ProductRecommendations, trackProductView } from "./product-recommendations";

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHUlEQVQIW2NkYGD4z8BQDwIMjIz1DEDMSNMAACb9Av9aFEHzAAAAAElFTkSuQmCC";

/** Number of product cards rendered eagerly (no IntersectionObserver). */
const EAGER_CARD_COUNT = 6;

/**
 * Custom loader that builds Shopify CDN resize URLs directly,
 * bypassing the Next.js `/_next/image` proxy for much faster delivery.
 */
function shopifyLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    if (quality) url.searchParams.set("quality", String(quality));
    return url.toString();
  } catch {
    return src;
  }
}

function LazyCard({ children, skeleton, eager }: { children: React.ReactNode; skeleton: React.ReactNode; eager?: boolean }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager ?? false);
  useEffect(() => {
    if (eager) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager]);
  if (eager) return <>{children}</>;
  return <div ref={ref}>{visible ? children : skeleton}</div>;
}

export function ShopifyBuyExperience({ initialProducts }: { initialProducts?: import("@/lib/shopify/types").ShopProduct[] }): React.JSX.Element {
  const shop = useShopExperience({ initialProducts });

  const analytics = useShopAnalytics(shop.activeUniverse);
  const { trackShopView } = analytics;
  const hasTrackedShopViewRef = useRef(false);

  useEffect(() => {
    if (hasTrackedShopViewRef.current) return;
    hasTrackedShopViewRef.current = true;
    trackShopView();
  }, [trackShopView]);

  const {
    activeUniverse,
    visualUniverse,
    visualTheme,
    imageFilterStyle,
    universeThemeVars,
    activateUniverse,
    activeCatalogHref,
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
    cart,
    cartItemCount,
    isMutatingCart,
    addToCart,
    totals,
    setDiscountCode,
    pricingCurrencyCode,
    selectedProduct,
    setSelectedProduct,
    selectedVariantByProduct: _selectedVariantByProduct,
    setSelectedVariantByProduct,
    getSelectedVariant,
    getProductQty,
    setProductQty,
    selectedModalVariant,
    selectedModalSoldOut,
    selectedModalStock,
    stickyProduct,
    stickyVariant,
    stickyCtaDisabled,
    quickBuyLabel,
    addRecommendedPack,
    wishlist,
    toggleWishlist: _toggleWishlist,
    showWishlistOnly,
    setShowWishlistOnly,
    feedbackMessage,
    lastAddedProductId,
    confettiByProduct,
    brokenShowcaseIds,
    setBrokenShowcaseIds,
    promoTimeLeft,
    isFabHovered,
    setIsFabHovered,
    isLoadingCollectionPreview,
    collectionPreviewError,
    retryCollectionPreview,
    activeCollectionPreviewHead,
    activeCollectionPreviewRemaining,
    activeCollectionShowcaseItems,
    activeCollectionShowcaseRemaining,
    comprasSectionRef,
  } = shop;

  // Derive values needed only in JSX
  const activeCollectionPreviewNames = [...activeCollectionPreviewHead];
  if (activeCollectionPreviewRemaining > 0) {
    // used below for empty-state check
  }

  return (
    <section id="compras" ref={comprasSectionRef} className="space-y-5 pb-28 lg:pb-6" style={universeThemeVars}>
      {/* ── Section header ── */}
      <div className="space-y-2 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--shop-primary-from)" }}>
          ✦ Empieza tu colección
        </p>
        <h2 className="font-title text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Elige tu pack
        </h2>
        <p className="text-sm text-[var(--ink-500)]">
          Cada pack trae figuras con rareza oficial. Agrégalo y paga en 1 minuto.
        </p>
      </div>

      {/* Abandoned cart reminder */}
      <AbandonedCartReminder />

      <Card
        className={`${visualTheme.shellClassName} border`}
        style={{
          borderColor: "var(--shop-shell-border)",
          background: "var(--shop-shell-bg)",
          boxShadow: "var(--shop-shell-shadow)",
        }}
      >
        <CardContent className="space-y-5 p-6 sm:p-8">
          {/* ── Fila 1: carrito ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-11 bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))]"
                disabled={stickyCtaDisabled}
                onClick={addRecommendedPack}
              >
                <ShoppingCartIcon className="h-4 w-4" />
                {stickyVariant ? `${quickBuyLabel} · ${formatMoney(stickyVariant.price)}` : quickBuyLabel}
              </Button>
              <Button asChild variant="secondary" className="h-11">
                <Link href={activeCatalogHref}>
                  <Squares2X2Icon className="h-4 w-4" /> Ver catálogo oficial
                </Link>
              </Button>
            </div>

            <Button
              className="h-12 shrink-0 flex-col gap-0 bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] px-5 leading-none"
              onClick={() => window.dispatchEvent(new Event("doflins:open-cart"))}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <ShoppingCartIcon className="h-4 w-4" /> Carrito ({cartItemCount})
              </span>
              {cartItemCount > 0 ? (
                <span className="text-[0.68rem] font-medium opacity-85">{totals.total}</span>
              ) : null}
            </Button>
          </div>

          {/* ── Tira: promo + trust ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--shop-chip-ring)] pt-4 text-xs">
            {FREE_GIFT_PROMO_LABEL || FREE_GIFT_MIN_SUBTOTAL ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--shop-chip-bg)] px-2.5 py-1 font-semibold text-[var(--shop-chip-text)] ring-1 ring-[var(--shop-chip-ring)]">
                🎁 {FREE_GIFT_PROMO_LABEL || `Regalo gratis desde ${formatCurrencyAmount(FREE_GIFT_MIN_SUBTOTAL ?? 0, pricingCurrencyCode)}`}
                {promoTimeLeft ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--shop-promo-timer-bg)] px-1.5 py-0.5 text-[var(--shop-promo-timer-text)]">
                    <ClockIcon className="h-3 w-3" />{promoTimeLeft}
                  </span>
                ) : null}
              </span>
            ) : null}
            <div className="flex items-center gap-2 ml-auto">
              <WatchingBadge universe={activeUniverse} />
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[var(--ink-700)] ring-1 ring-[#d6d2b4]">
                <LockClosedIcon className="h-3.5 w-3.5 text-[var(--shop-primary-from)]" /> Pago seguro
              </span>
            </div>
          </div>

          {/* ── Universe selector ── */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => activateUniverse("animals")}
              className={`group flex items-center gap-2 sm:gap-3 rounded-2xl border-2 p-2.5 sm:p-4 text-left transition-all duration-200 ${
                visualUniverse === "animals"
                  ? "border-[#4e6f2a] bg-[linear-gradient(135deg,#eef5de,#daeab8)] shadow-[0_8px_20px_rgba(78,111,42,0.22)]"
                  : "border-black/10 bg-white/60 hover:bg-white/80 hover:border-black/20"
              }`}
            >
              <span className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                visualUniverse === "animals" ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white shadow-md" : "bg-black/[0.06] text-[var(--ink-600)]"
              }`}>
                <SparklesIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 hidden sm:block">
                <p className={`text-sm font-bold leading-tight ${ visualUniverse === "animals" ? "text-[#1f2a1a]" : "text-[var(--ink-700)]" }`}>Animals</p>
                <p className={`truncate text-xs ${ visualUniverse === "animals" ? "text-[#3d5230]" : "text-[var(--ink-600)]" }`}>Criaturas naturales</p>
              </div>
              {visualUniverse === "animals" ? <CheckCircleIcon className="ml-auto h-5 w-5 shrink-0 text-[#4e6f2a] hidden sm:block" /> : null}
            </button>

            <button
              type="button"
              onClick={() => activateUniverse("multiverse")}
              className={`group flex items-center gap-2 sm:gap-3 rounded-2xl border-2 p-2.5 sm:p-4 text-left transition-all duration-200 ${
                visualUniverse === "multiverse"
                  ? "border-[#4b5fc0] bg-[linear-gradient(135deg,#eef0ff,#d8deff)] shadow-[0_8px_20px_rgba(75,95,192,0.22)]"
                  : "border-black/10 bg-white/60 hover:bg-white/80 hover:border-black/20"
              }`}
            >
              <span className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                visualUniverse === "multiverse" ? "bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] text-white shadow-md" : "bg-black/[0.06] text-[var(--ink-600)]"
              }`}>
                <BoltIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 hidden sm:block">
                <p className={`text-sm font-bold leading-tight ${ visualUniverse === "multiverse" ? "text-[#1c2960]" : "text-[var(--ink-700)]" }`}>Multiverse</p>
                <p className={`truncate text-xs ${ visualUniverse === "multiverse" ? "text-[#2d3f7a]" : "text-[var(--ink-600)]" }`}>Sci-fi &amp; alto impacto</p>
              </div>
              {visualUniverse === "multiverse" ? <CheckCircleIcon className="ml-auto h-5 w-5 shrink-0 text-[#4b5fc0] hidden sm:block" /> : null}
            </button>

            <button
              type="button"
              onClick={() => activateUniverse("mega")}
              className={`group flex items-center gap-2 sm:gap-3 rounded-2xl border-2 p-2.5 sm:p-4 text-left transition-all duration-200 ${
                visualUniverse === "mega"
                  ? "border-[#c47c20] bg-[linear-gradient(135deg,#fffbee,#fdf0c8)] shadow-[0_8px_20px_rgba(196,124,32,0.22)]"
                  : "border-black/10 bg-white/60 hover:bg-white/80 hover:border-black/20"
              }`}
            >
              <span className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                visualUniverse === "mega" ? "bg-[linear-gradient(135deg,#c47c20,#e8a830)] text-white shadow-md" : "bg-black/[0.06] text-[var(--ink-600)]"
              }`}>
                <FireIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 hidden sm:block">
                <p className={`text-sm font-bold leading-tight ${ visualUniverse === "mega" ? "text-[#6a3f10]" : "text-[var(--ink-700)]" }`}>MEGA</p>
                <p className={`truncate text-xs ${ visualUniverse === "mega" ? "text-[#7a4e14]" : "text-[var(--ink-600)]" }`}>Figuras gigantes</p>
              </div>
              {visualUniverse === "mega" ? <CheckCircleIcon className="ml-auto h-5 w-5 shrink-0 text-[#c47c20] hidden sm:block" /> : null}
            </button>
          </div>

          {/* ── Search & filters — solo visible con 7+ productos ── */}
          {products.length > 6 ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <label htmlFor="shop-search" className="sr-only">Buscar pack</label>
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-500)]" />
                  <Input
                    id="shop-search"
                    value={shopSearch}
                    onChange={(event) => { setShopSearch(event.target.value); analytics.trackSearch(event.target.value); }}
                    placeholder="Buscar por nombre de pack…"
                    className="h-10 rounded-xl pl-9 transition-shadow duration-200 focus:ring-2 focus:ring-[var(--shop-primary-from)]/20"
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
                        : "border-[var(--shop-control-border)] bg-[var(--shop-control-bg)] text-[var(--ink-500)] hover:text-red-400"
                    }`}
                    onClick={() => setShowWishlistOnly((v) => !v)}
                  >
                    <HeartIcon className="h-5 w-5" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex gap-1 rounded-full border p-1 text-xs shadow-sm" style={{ borderColor: "var(--shop-control-border)", background: "var(--shop-control-bg)" }}>
                    {(["default", "new", "asc", "desc"] as const).map((order) => {
                      const labels: Record<typeof order, string> = { default: "Todos", new: "Nuevos", asc: "Menor precio", desc: "Mayor precio" };
                      return (
                        <button
                          key={order}
                          type="button"
                          className={`rounded-full px-3 py-1 font-medium transition ${
                            sortOrder === order
                              ? "bg-[var(--shop-primary-from)] text-white shadow-sm"
                              : "text-[var(--ink-700)] hover:bg-black/[0.05]"
                          }`}
                          onClick={() => { setSortOrder(order); analytics.trackFilter(`sort:${order}`); }}
                        >
                          {labels[order]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="inline-flex rounded-full border p-1" style={{ borderColor: "var(--shop-control-border)", background: "var(--shop-control-bg)" }}>
                    <button
                      type="button"
                      aria-label="Vista grilla"
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                        gridView === "grid" ? "bg-[var(--shop-primary-from)] text-white" : "text-[var(--ink-700)] hover:bg-black/[0.05]"
                      }`}
                      onClick={() => setGridView("grid")}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Vista lista"
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                        gridView === "list" ? "bg-[var(--shop-primary-from)] text-white" : "text-[var(--ink-700)] hover:bg-black/[0.05]"
                      }`}
                      onClick={() => setGridView("list")}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {/* ── Feedback ── */}
          {feedbackMessage ? (
            <p
              aria-live="polite"
              className={`rounded-2xl border px-4 py-2 text-sm ${
                /agregado|aplicado/i.test(feedbackMessage)
                  ? "border-[var(--shop-chip-ring)] bg-[var(--shop-chip-bg)] text-[var(--shop-chip-text)]"
                  : "border-[#e7c7c7] bg-[#fff3f3] text-[#7b2e2e]"
              }`}
            >
              {feedbackMessage}
            </p>
          ) : null}

          {/* ── Error state ── */}
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
                <Button asChild size="sm" className="h-10 bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))]">
                  <a href={SUPPORT_WHATSAPP_URL} rel="noreferrer" target="_blank">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" /> Ir a WhatsApp
                  </a>
                </Button>
              </div>
              {productsErrorCode ? <p className="mt-2 text-xs text-[#8f4949]">Código: {productsErrorCode}</p> : null}
            </div>
          ) : null}

          {/* ── Loading state ── */}
          {isLoadingProducts ? (
            <div className="space-y-3">
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border p-4" style={{ borderColor: 'var(--shop-card-border)', background: 'var(--shop-card-bg)' }}>
                    <div className="skeleton-shimmer h-36 rounded-xl" style={{ background: 'var(--shop-skeleton-base)' }} />
                    <div className="mt-3 skeleton-shimmer h-3 w-16 rounded" style={{ background: 'var(--shop-skeleton-hi)' }} />
                    <div className="mt-2 skeleton-shimmer h-7 w-4/5 rounded" style={{ background: 'var(--shop-skeleton-hi)' }} />
                    <div className="mt-4 skeleton-shimmer h-4 w-full rounded" style={{ background: 'var(--shop-skeleton-base)' }} />
                    <div className="mt-3 skeleton-shimmer h-12 rounded-full" style={{ background: 'var(--shop-skeleton-base)' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Empty catalog with collection preview ── */}
          {!isLoadingProducts && !productsError && !products.length && activeCollectionPreviewNames.length > 0 ? (
            <div className="space-y-3 rounded-2xl border border-[var(--shop-chip-ring)] bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--ink-900)]">
                  Figuras de {UNIVERSE_LABELS[activeUniverse]} que te pueden tocar
                </p>
                <Button asChild size="sm" variant="secondary" className="h-9">
                  <Link href={activeCatalogHref}>
                    <Squares2X2Icon className="h-4 w-4" /> Ver catálogo completo
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeCollectionPreviewHead.map((name) => (
                  <span key={`empty-state-${activeUniverse}-${name}`} className="rounded-full bg-[var(--shop-chip-bg)] px-2.5 py-1 text-xs font-medium text-[var(--shop-chip-text)] ring-1 ring-[var(--shop-chip-ring)]">
                    {name}
                  </span>
                ))}
                {activeCollectionPreviewRemaining > 0 ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink-700)] ring-1 ring-black/10">
                    +{activeCollectionPreviewRemaining} más
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DROP_TIER_ORDER.map((tier) => (
                  <span key={`empty-state-tier-${tier}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink-700)] ring-1 ring-black/10">
                    {DROP_TIER_LABELS[tier]} {DROP_TIER_PROBABILITY[tier]}%
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {!isLoadingProducts && !productsError && !products.length ? (
            <div className="rounded-2xl border border-[#d8d3b2] bg-white/82 p-5 text-center">
              <p className="text-3xl">🚀</p>
              <p className="mt-2 font-semibold text-[var(--ink-900)]">Packs de {UNIVERSE_LABELS[activeUniverse]} — Próximamente</p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">Estamos preparando los packs de este universo. Mientras tanto, explora los packs disponibles en otros universos.</p>
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

          {/* ── Product grid ── */}
          {!isLoadingProducts ? (
            <div className="space-y-4">
            {!shopSearch.trim() && !showWishlistOnly && BUNDLE_PROMO_CODE && filteredProducts.length >= 2 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[var(--shop-chip-ring)] bg-[var(--shop-chip-bg)] px-5 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--ink-900)]">
                    🎁 ¡Lleva 3 packs y ahorra!
                  </p>
                  <p className="text-xs text-[var(--ink-700)] mt-0.5">
                    Agrega 3 packs al carrito y aplica el código{" "}
                    <button
                      type="button"
                      className="font-mono font-bold text-[var(--shop-primary-from)] underline"
                      onClick={() => {
                        window.dispatchEvent(new Event("doflins:open-cart"));
                        setDiscountCode(BUNDLE_PROMO_CODE);
                      }}
                    >
                      {BUNDLE_PROMO_CODE}
                    </button>{" "}
                    en el carrito para obtener tu descuento.
                  </p>
                </div>
                <Button
                  className="h-9 shrink-0 bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] text-sm"
                  disabled={isMutatingCart || !stickyProduct}
                  onClick={() => {
                    if (stickyProduct) void addToCart(stickyProduct, 3);
                  }}
                >
                  Agregar 3 packs
                </Button>
              </div>
            ) : null}

            <div
              key={gridAnimKey}
              className={gridView === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}
              style={{ animation: "catalog-fadein 0.35s ease" }}
            >
              {filteredProducts.map((product, productIndex) => {
                const selectedVariant = getSelectedVariant(product);
                const isSoldOut = !selectedVariant?.availableForSale;
                const isLiveNew = liveNewProducts[activeUniverse].includes(product.id);
                const isBestSeller = BEST_SELLER_HANDLES.has(product.handle.toLowerCase());
                const stockBadge = resolveStockBadge(selectedVariant);
                const isJustAdded = lastAddedProductId === product.id;
                const isEager = productIndex < EAGER_CARD_COUNT;

                return (
                  <LazyCard
                    key={product.id}
                    eager={isEager}
                    skeleton={
                      gridView === "list" ? (
                        <div className="flex h-20 overflow-hidden rounded-3xl border" style={{ borderColor: "var(--shop-card-border)", background: "var(--shop-control-bg)" }}>
                          <div className="aspect-square w-24 shrink-0 animate-pulse" style={{ background: "var(--shop-skeleton-base)" }} />
                          <div className="flex flex-1 flex-col justify-center gap-2 p-4">
                            <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: "var(--shop-skeleton-hi)" }} />
                            <div className="h-4 w-1/2 animate-pulse rounded" style={{ background: "var(--shop-skeleton-hi)" }} />
                          </div>
                        </div>
                      ) : (
                      <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--shop-card-border)", background: "var(--shop-control-bg)" }}>
                        <div className="aspect-[16/11] w-full animate-pulse" style={{ background: "var(--shop-skeleton-base)" }} />
                        <div className="p-5 space-y-3">
                          <div className="h-3 w-16 animate-pulse rounded" style={{ background: "var(--shop-skeleton-hi)" }} />
                          <div className="h-7 w-4/5 animate-pulse rounded" style={{ background: "var(--shop-skeleton-hi)" }} />
                          <div className="h-12 animate-pulse rounded-full" style={{ background: "var(--shop-skeleton-base)" }} />
                        </div>
                      </div>
                      )
                    }
                  >
                    <article
                    className={`group flex h-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ease-out ${
                      gridView === "list" ? "flex-row" : "flex-col hover:-translate-y-1"
                    } ${gridView !== "list" && isBestSeller ? "ring-2" : ""}`}
                    style={{
                      background: "var(--shop-card-bg)",
                      borderColor: isBestSeller ? "var(--shop-primary-from)" : "var(--shop-card-border)",
                      borderWidth: isBestSeller ? "2px" : undefined,
                      boxShadow: isBestSeller ? "var(--shop-card-hover-shadow)" : "var(--shop-card-shadow)",
                      ...(gridView !== "list" && isBestSeller ? { ["--tw-ring-color" as string]: "var(--shop-primary-from)" } : {}),
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shop-card-hover-shadow)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = isBestSeller ? "var(--shop-card-hover-shadow)" : "var(--shop-card-shadow)"; }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalle rápido de ${product.title}`}
                    onClick={() => { setSelectedProduct(product); trackProductView(product.handle, product.universe); analytics.trackQuickViewOpen(product.handle, product.title, Math.round(Number(product.price.amount) * 100)); }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedProduct(product);
                        trackProductView(product.handle, product.universe);
                        analytics.trackQuickViewOpen(product.handle, product.title, Math.round(Number(product.price.amount) * 100));
                      }
                    }}
                    >
                    <div className={`relative overflow-hidden bg-[var(--shop-image-panel-bg)] ${
                        gridView === "list" ? "aspect-square w-24 shrink-0 sm:w-32" : "aspect-[4/3] w-full"
                      }`}>
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.imageAlt ?? product.title}
                          fill
                          loader={shopifyLoader}
                          priority={isEager}
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          sizes={gridView === "list" ? "128px" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"}
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                          style={imageFilterStyle}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-[var(--ink-600)]">
                          <PhotoIcon className="h-6 w-6" />
                          Sin imagen
                        </div>
                      )}
                      {isJustAdded ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                          <span className="animate-card-pop flex items-center gap-2 rounded-full bg-[var(--shop-added-badge-bg)] px-4 py-2 text-sm font-bold text-white shadow-lg">
                            <CheckCircleIcon className="h-5 w-5" /> Agregado al carrito
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className={`flex flex-1 flex-col gap-3 ${ gridView === "list" ? "justify-center p-3 sm:p-4" : "p-5" }`}>
                      {gridView !== "list" ? (() => {
                        if (isBestSeller) return <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--shop-primary-from)" }}>✦ Más vendido</p>;
                        if (isLiveNew) return <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Nuevo</p>;
                        const tier = getPackTier(Number(product.price.amount));
                        return <p className="text-xs font-medium uppercase tracking-widest text-[var(--ink-400)]">{tier.label}</p>;
                      })() : null}
                      <h4 className={`font-title leading-tight text-[var(--ink-900)] ${ gridView === "list" ? "text-base sm:text-lg" : "text-xl sm:text-2xl" }`}>{product.title}</h4>

                      {gridView === "list" ? (
                        <div className="mt-auto flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <span className="font-title text-lg font-bold text-[var(--ink-900)]">{formatMoney(selectedVariant?.price ?? product.price)}</span>
                          {isSoldOut ? (
                            <span className="ml-auto rounded-full bg-[#f5f4ef] px-3 py-1.5 text-xs font-medium text-[var(--ink-500)]">Agotado</span>
                          ) : (
                            <Button
                              className="ml-auto h-9 shrink-0 bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] px-4 text-sm font-bold"
                              disabled={isMutatingCart}
                              onClick={(e) => { e.stopPropagation(); void addToCart(product, 1); analytics.trackAddToCart(product.handle, product.title, selectedVariant?.id ?? '', Math.round(Number(selectedVariant?.price.amount ?? product.price.amount) * 100), 1); }}
                            >
                              <ShoppingCartIcon className="h-4 w-4" /> Agregar
                            </Button>
                          )}
                        </div>
                      ) : (
                      <div className="mt-auto space-y-3">
                        <div className="flex items-baseline gap-2">
                          <p className="font-title text-3xl leading-none" style={{ color: "var(--shop-primary-from)" }}>{formatMoney(selectedVariant?.price ?? product.price)}</p>
                          {(() => {
                            const count = figureCountFromHandle(product.handle);
                            const price = Number(selectedVariant?.price?.amount ?? product.price.amount);
                            if (!count || !price) return null;
                            return (
                              <span className="text-xs text-[var(--ink-500)]">
                                ${Math.round(price / count)} / figura
                              </span>
                            );
                          })()}
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
                                    ? "border-[var(--shop-primary-from)] bg-[var(--shop-primary-from)] text-white"
                                    : variant.availableForSale
                                      ? "border-[var(--shop-control-border)] bg-[var(--shop-control-bg)] text-[var(--ink-800)] hover:border-[var(--shop-primary-from)]"
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

                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {confettiByProduct.has(product.id) ?
                            ([
                              { tx: "-22px", rot: "-28deg", color: "var(--shop-primary-to)" },
                              { tx: "-8px",  rot: "18deg",  color: "#ffe9b5" },
                              { tx:  "8px",  rot: "54deg",  color: "var(--shop-primary-from)" },
                              { tx:  "22px", rot: "-52deg", color: "var(--shop-chip-ring)" },
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
                            <div className="space-y-1.5">
                              <Button
                                className="h-12 w-full opacity-40"
                                style={{ background: "var(--shop-card-border)", color: "var(--ink-700)" }}
                                disabled
                              >
                                Agotado temporalmente
                              </Button>
                              {activeUniverse === "animals" ? (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); activateUniverse("multiverse"); }}
                                  className="w-full rounded-full py-1.5 text-xs font-medium text-[var(--ink-500)] transition hover:text-[var(--ink-900)]"
                                >
                                  ¿Ver Multiverse? →
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); activateUniverse("animals"); }}
                                  className="w-full rounded-full py-1.5 text-xs font-medium text-[var(--ink-500)] transition hover:text-[var(--ink-900)]"
                                >
                                  ¿Ver Animals? →
                                </button>
                              )}
                            </div>
                          ) : (
                            <Button
                              className={`h-12 w-full text-base font-bold bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] ${lastAddedProductId === product.id ? "animate-card-pop" : ""}`}
                              disabled={isMutatingCart}
                              onClick={(event) => {
                                event.stopPropagation();
                                void addToCart(product, 1);
                                analytics.trackAddToCart(product.handle, product.title, selectedVariant?.id ?? '', Math.round(Number(selectedVariant?.price.amount ?? product.price.amount) * 100), 1);
                              }}
                            >
                              Agregar al carrito
                            </Button>
                          )}
                        </div>
                      </div>
                      )}
                    </div>
                  </article>
                  </LazyCard>
                );
              })}
            </div>
            </div>
          ) : null}

          {/* ── Collection showcase ── */}
          {!isLoadingProducts && !productsError ? (
            <div className="space-y-3 rounded-3xl border border-[var(--shop-chip-ring)] bg-[linear-gradient(150deg,#ffffff,#f5f8ea)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">Personajes que te pueden tocar</p>
                  <p className="text-xs text-[var(--ink-700)]">
                    Vista rápida del catálogo de {UNIVERSE_LABELS[activeUniverse]} para incentivar tu compra.
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm" className="h-9">
                  <Link href={activeCatalogHref}>
                    <Squares2X2Icon className="h-4 w-4" /> Ver catálogo completo
                  </Link>
                </Button>
              </div>

              {isLoadingCollectionPreview ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--shop-card-border)', background: 'var(--shop-control-bg)' }}>
                      <div className="skeleton-shimmer aspect-square" style={{ background: 'var(--shop-skeleton-base)' }} />
                      <div className="space-y-1.5 px-2.5 py-2">
                        <div className="skeleton-shimmer h-3 w-3/4 rounded" style={{ background: 'var(--shop-skeleton-hi)' }} />
                        <div className="skeleton-shimmer h-3 w-1/2 rounded" style={{ background: 'var(--shop-skeleton-base)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeCollectionShowcaseItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {activeCollectionShowcaseItems.map((item) => {
                      const tier = toDropTier(item.rarity);
                      const itemLabel = formatCollectionPreviewName(item);
                      return (
                        <article key={`catalog-showcase-${activeUniverse}-${item.id}`} className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--shop-card-border)", background: "var(--shop-control-bg)" }}>
                          <div className="relative aspect-square bg-[var(--shop-image-panel-bg)]">
                            {item.imageUrl && !brokenShowcaseIds.has(item.id) ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                loader={shopifyLoader}
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                className="object-cover"
                                onError={() => setBrokenShowcaseIds(prev => new Set(prev).add(item.id))}
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[var(--shop-image-panel-bg)] to-transparent">
                                <span className="text-2xl opacity-40" aria-hidden>❓</span>
                                <span className="text-[10px] font-medium text-[var(--ink-500)]">Por revelar</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 px-2.5 py-2">
                            <p className="min-h-[2.25rem] text-[11px] font-semibold leading-tight text-[var(--ink-900)]">{itemLabel}</p>
                            <div className="flex items-center justify-between gap-1">
                              <span className="rounded-full bg-[var(--shop-chip-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--shop-chip-text)] ring-1 ring-[var(--shop-chip-ring)]">
                                {DROP_TIER_LABELS[tier]}
                              </span>
                              <span className="text-[10px] font-semibold text-[var(--ink-600)]">#{item.collectionNumber}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DROP_TIER_ORDER.map((tier) => (
                      <span key={`catalog-showcase-tier-${tier}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink-700)] ring-1 ring-black/10">
                        {DROP_TIER_LABELS[tier]} {DROP_TIER_PROBABILITY[tier]}%
                      </span>
                    ))}
                    {activeCollectionShowcaseRemaining > 0 ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink-700)] ring-1 ring-black/10">
                        +{activeCollectionShowcaseRemaining} personajes más en catálogo
                      </span>
                    ) : null}
                  </div>
                </>
              ) : collectionPreviewError ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-[var(--ink-700)]">No se pudo cargar el catálogo de personajes.</p>
                  <Button variant="secondary" size="sm" onClick={retryCollectionPreview}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-700)]">Aún no hay personajes visibles para este universo.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Reseñas de clientes ── */}
      <ReviewsSection universeThemeVars={universeThemeVars} />

      {/* FAB carrito flotante — siempre visible en móvil */}
      <div
        className="fixed z-40 flex flex-col items-end gap-2 lg:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.5rem)", right: "1rem" }}
        onMouseEnter={() => setIsFabHovered(true)}
        onMouseLeave={() => setIsFabHovered(false)}
        onFocus={() => setIsFabHovered(true)}
        onBlur={() => setIsFabHovered(false)}
      >
        {isFabHovered && cart?.lines.length ? (
            <div className="w-64 rounded-2xl border border-[#d7d7c3] bg-white p-3 shadow-[0_8px_24px_rgba(44,47,23,0.18)] animate-catalog-fadein">
              <p className="mb-2 text-xs font-semibold text-[var(--ink-900)]">En tu carrito</p>
              {cart.lines.slice(-2).map((line) => (
                <div key={line.id} className="flex items-center gap-2 py-1">
                  {line.imageUrl ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#ddd9c5] bg-[#f1f2e6]">
                      <Image src={line.imageUrl} alt={line.productTitle} fill loader={shopifyLoader} sizes="36px" className="object-cover" />
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
            aria-label={cartItemCount > 0 ? `Abrir carrito — ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}` : "Abrir carrito"}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] text-white shadow-[0_8px_24px_rgba(50,80,25,0.42)] transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-primary-from)]"
            onClick={() => window.dispatchEvent(new Event("doflins:open-cart"))}
          >
            <ShoppingCartIcon className="h-6 w-6" />
            {cartItemCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            ) : null}
          </button>
        </div>

      {/* Quick view modal */}
      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) { setSelectedProduct(null); if (selectedProduct) analytics.trackQuickViewClose(selectedProduct.handle); }
        }}
      >
        <DialogContent className="w-[min(94vw,920px)] gap-0 overflow-hidden p-0" style={universeThemeVars}>
          {selectedProduct ? (
            <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative flex min-h-[320px] items-center justify-center bg-[var(--shop-image-panel-bg)] p-4 sm:p-6">
                {selectedProduct.imageUrl ? (
                  <div className="relative h-[280px] w-full overflow-hidden rounded-2xl sm:h-[340px]" style={{ boxShadow: "var(--shop-image-shadow)" }}>
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.imageAlt ?? selectedProduct.title}
                      fill
                      loader={shopifyLoader}
                      priority
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition duration-300"
                      style={imageFilterStyle}
                    />
                  </div>
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm text-[var(--ink-600)]">
                    <PhotoIcon className="h-7 w-7" /> Sin imagen disponible
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-[var(--shop-image-overlay)]" />
                <span
                  className={`absolute right-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${selectedModalStock.className}`}
                >
                  {selectedModalStock.label}
                </span>
              </div>
              <div className="flex max-h-[80vh] flex-col overflow-hidden">
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
                      style={{ background: "var(--shop-modal-universe-badge-bg)", color: "#fff" }}
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
                  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--shop-card-border)", background: "var(--shop-card-bg)" }}>
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
                  <div className="flex items-center justify-between gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--shop-control-border)", background: "var(--shop-control-bg)" }}>
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
                <div className="shrink-0 border-t p-4" style={{ borderColor: "var(--shop-card-border)", background: "var(--shop-control-bg)" }}>
                  <Button
                    className={`w-full ${selectedModalSoldOut ? "bg-[#b9c8a3] text-white" : "bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] text-white hover:opacity-90"}`}
                    disabled={isMutatingCart || selectedModalSoldOut}
                    onClick={() => {
                      const qty = getProductQty(selectedProduct.id);
                      const variant = getSelectedVariant(selectedProduct);
                      void addToCart(selectedProduct, qty);
                      analytics.trackAddToCart(selectedProduct.handle, selectedProduct.title, variant?.id ?? '', Math.round(Number(variant?.price.amount ?? selectedProduct.price.amount) * 100), qty);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCartIcon className="h-5 w-5" />{" "}
                    {selectedModalSoldOut
                      ? "Agotado"
                      : `Agregar ×${getProductQty(selectedProduct.id)}`}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Product recommendations */}
      <ProductRecommendations
        products={products}
        currentHandle={selectedProduct?.handle}
        onAddToCart={(product) => {
          void addToCart(product, 1);
          const variant = getSelectedVariant(product);
          analytics.trackAddToCart(product.handle, product.title, variant?.id ?? '', Math.round(Number(variant?.price.amount ?? product.price.amount) * 100), 1);
        }}
        isMutating={isMutatingCart}
      />
    </section>
  );
}
