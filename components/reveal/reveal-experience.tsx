"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BoltIcon,
  CheckCircleIcon,
  CubeIcon,
  FireIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TicketIcon,
  WifiIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

import {
  CATALOG_RARITY_CONFIG,
  CATALOG_RARITY_ORDER,
  type CatalogRarity,
} from "@/lib/constants/rarity";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import type { CollectionItemDTO, Rarity } from "@/lib/types/doflin";
import { Figure3D } from "@/components/reveal/figure-3d";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LazySection } from "@/components/ui/lazy-section";

import { AuthPromptDialog } from "./auth-prompt-dialog";
import {
  BUY_PACK_OPTIONS,
  FALLBACK_DOFLIN_IMAGE,
  MODEL_CONFIG_BY_COLLECTION,
  RARITY_FILTER_OPTIONS,
  RARITY_GLOW_CSS,
} from "./constants";
import { DoflinModal } from "./doflin-modal";
import { MegaCinematicIntro, MegaDecorations, MegaScaleComparison } from "./mega-components";
import { RarityParticles } from "./rarity-particles";
import { RarityPill } from "./rarity-pill";
import { useRevealExperience } from "./use-reveal-experience";
import { baseModelKey, isOriginalVariant, variantLabel } from "./utils";

// ─── Main component ─────────────────────────────────────────────────────────


interface RevealExperienceProps {
  initialCollection?: CollectionItemDTO[];
  initialRemaining?: Record<Rarity, number>;
}

export function RevealExperience({
  initialCollection,
  initialRemaining,
}: RevealExperienceProps): React.JSX.Element {
  const dark = useDarkMode();

  const {
    loadMoreRef,
    activeUniverse,
    rarityFilter,
    searchQuery,
    setSearchQuery,
    selectedPackSize,
    setSelectedPackSize,
    setVisiblePages,
    selectedDoflin,
    setSelectedDoflin,
    brokenModalImageIds,
    setBrokenModalImageIds,
    brokenVariantImageIds,
    setBrokenVariantImageIds,
    isLoadingCollection,
    setDebouncedSearchQuery,
    isAuthenticatedViewer,
    viewerEmail,
    isAuthActionLoading,
    isAuthPromptOpen,
    setIsAuthPromptOpen,
    isOffline,
    showMegaIntro,
    megaRumble,
    packPrices,
    featuredCollection,
    collectionCounts,
    filteredCollection,
    activeConfig,
    activeTheme,
    ownedSet,
    activeUniverseCollection,
    activeBaseModelStats,
    ownedTotalCount,
    ownedActiveUniverseCount,
    ownedTotalPercent,
    ownedActiveUniversePercent,
    ownedByRarity,
    selectedDoflinModelConfig,
    selectedDoflinHas3DModel,
    selectedDoflinRarityConfig,
    selectedDoflinIsOwned,
    selectedDoflinGroupStats,
    selectedDoflinIsOriginal,
    selectedPurchaseUniverse,
    selectedDoflinImageSrc,
    remainingLegendaryCount,
    selectedDoflinVariants,
    activeCatalogCards,
    visibleCards,
    hasMoreCards,
    selectedDoflinIndexInCatalog,
    rarityCountMap,
    themeVars,
    mainInkScopeClass,
    ctaPrimaryButtonTextClass,
    shopUrl,
    selectedShopUrl,
    tikTokUrl,
    handleMegaIntroComplete,
    scrollToSection,
    switchUniverse,
    applyRarityFilter,
    handleUserLogin,
    markAsOwned,
    clearOwnedMark,
    requestAuthForProgress,
    handleShareDoflin,
    handlePurchaseIntent,
    handleOpenCard,
  } = useRevealExperience({ initialCollection, initialRemaining, dark });

  const setRarityFilter = (value: "all" | CatalogRarity) => applyRarityFilter(value, "catalog_rarity");

  return (
    <main className={`relative pb-36 md:pb-24 ${mainInkScopeClass} ${megaRumble ? "mega-rumble" : ""}`} style={themeVars}>
      {/* Mega cinematic intro overlay */}
      <MegaCinematicIntro show={showMegaIntro} onComplete={handleMegaIntroComplete} />

      {isOffline ? (
        <div className="sticky top-14 z-50 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
          <WifiIcon className="h-4 w-4" />
          Sin conexión — los datos pueden estar desactualizados
        </div>
      ) : null}
      <div className={`pointer-events-none fixed inset-0 -z-30 ${activeTheme.pageGlow}`} style={{ willChange: 'auto' }} />
      <div className={`pointer-events-none fixed inset-0 -z-20 ${activeTheme.pageGradient}`} />


      <div className="relative">
        {/* Subtle floating leaf decorations — Animals only */}
        {activeUniverse === "animals" ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            <span className="home-deco catalog-deco--1">🍃</span>
            <span className="home-deco catalog-deco--2">✦</span>
            <span className="home-deco catalog-deco--3">🌿</span>
            <span className="home-deco catalog-deco--4">✦</span>
          </div>
        ) : null}

        {/* Mega floating decorations — giant footprints and scale indicators */}
        {activeUniverse === "mega" ? <MegaDecorations /> : null}

        <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-10 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div className="space-y-6">
            <Badge className={activeTheme.heroBadge}>{activeTheme.heroTag}</Badge>

            {/* Mega enhanced hero title — dramatically larger with cinematic entrance */}
            {activeUniverse === "mega" ? (
              <>
                <div className="mega-title-entrance space-y-1">
                  <h1 className="mega-breathe font-title text-7xl leading-[0.85] tracking-tighter text-[var(--ink-900)] sm:text-8xl md:text-9xl">
                    <span className="block text-amber-600/90">MEGA</span>
                    <span className="block text-4xl tracking-tight sm:text-5xl">Animals</span>
                  </h1>
                  <p className="max-w-lg text-lg font-semibold leading-relaxed text-amber-800/80 sm:text-xl">
                    Figuras de escala masiva. Presencia que se siente.
                  </p>
                </div>
                <p className="max-w-2xl text-[1.05rem] leading-relaxed text-[var(--ink-700)]">
                  {activeTheme.heroDescription}
                </p>
                <MegaScaleComparison />
              </>
            ) : (
              <>
                <h1 className="font-title text-5xl leading-[0.95] tracking-tight text-[var(--ink-900)] sm:text-6xl">
                  {activeTheme.heroTitle}
                </h1>
                <p className="max-w-2xl text-[1.15rem] leading-relaxed text-[var(--ink-700)]">
                  {activeTheme.heroDescription}
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className={`h-12 ${activeTheme.primaryButton}`} onClick={() => scrollToSection("catalogo")}>
                <SparklesIcon className="h-5 w-5" /> Ver catálogo
              </Button>
              <Button variant="secondary" size="lg" className="h-12" onClick={() => scrollToSection("guia")}>
                <InformationCircleIcon className="h-5 w-5" /> Cómo coleccionar
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-12 touch-manipulation">
                <a
                  href={shopUrl}
                  onClick={() => handlePurchaseIntent({ source: "hero_buy", packSize: activeUniverse === "mega" ? undefined : 15 })}
                >
                  <ShoppingCartIcon className="h-5 w-5" /> {activeUniverse === "mega" ? "Ver figuras MEGA" : `Comprar ${activeConfig.label}`}
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-[var(--ink-700)]">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 ${activeTheme.heroChip}`}>
                <ShieldCheckIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Rareza oficial
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 ${activeTheme.heroChip}`}>
                <CubeIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Catálogo oficial por figura
              </span>
            </div>
          </div>

          <Card className={`overflow-hidden ${activeTheme.heroStateCard}`}>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Estado de colección</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#edf4d9,#d8eaaf)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Animals</p>
                  <p className="mt-1 text-3xl font-black text-[var(--ink-900)]">{collectionCounts.animals}</p>
                  <p className="text-xs text-[var(--ink-700)]">modelos activos</p>
                </div>
                <div className="rounded-2xl bg-[linear-gradient(135deg,#fff8e0,#fce8b0)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Mega</p>
                  <p className="mt-1 text-3xl font-black text-[var(--ink-900)]">{collectionCounts.mega}</p>
                  <p className="text-xs text-[var(--ink-700)]">modelos activos</p>
                </div>
                <div className="rounded-2xl bg-[linear-gradient(135deg,#e8efff,#d3e0ff)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Multiverse</p>
                  <p className="mt-1 text-3xl font-black text-[var(--ink-900)]">{collectionCounts.multiverse}</p>
                  <p className="text-xs text-[var(--ink-700)]">modelos activos</p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-[var(--ink-700)]">
                  <span>Tu progreso total</span>
                  <span>
                    {ownedTotalCount}/{featuredCollection.length} ({ownedTotalPercent}%)
                  </span>
                </div>
                <Progress value={ownedTotalPercent} />
                {isAuthenticatedViewer && ownedTotalCount > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {CATALOG_RARITY_ORDER.map((rarity) => {
                      const stats = ownedByRarity[rarity];
                      const cfg = CATALOG_RARITY_CONFIG[rarity];
                      return (
                        <div
                          key={rarity}
                          className="relative flex items-center justify-between overflow-hidden rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                          style={{ backgroundColor: cfg.softColor, color: cfg.color }}
                        >
                          <span className="flex items-center gap-1">
                            {stats.owned === stats.total && stats.total > 0 ? (
                              <SparklesIcon className="h-3 w-3 animate-sparkle-pop" />
                            ) : null}
                            {cfg.label}
                          </span>
                          <span className="font-black">
                            {stats.owned === stats.total && stats.total > 0 ? "✓ " : ""}{stats.owned}/{stats.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <p className="text-xs text-[var(--ink-600)]">
                  El progreso se guarda en tu cuenta. Si no inicias sesión, no se registra.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </section>

      </div>

      {/* Animals — elegant botanical section separator */}
      {activeUniverse === "animals" ? (
        <div aria-hidden className="animals-section-sep mx-6 sm:mx-10">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 2 C9 2 4 5 4 10 C4 14 9 16 9 16 C9 16 14 14 14 10 C14 5 9 2 9 2Z" fill="rgba(75,120,40,0.35)"/>
            <path d="M9 16 L9 5" stroke="rgba(75,120,40,0.45)" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
      ) : null}

      {/* Mega — earthquake crack section separator */}
      {activeUniverse === "mega" ? (
        <div aria-hidden className="mega-section-sep mx-6 sm:mx-10">
          <span className="text-2xl" style={{ filter: "grayscale(0.3)" }}>⚡</span>
        </div>
      ) : null}

      <section className="mx-auto w-full max-w-6xl px-5 pt-4 pb-8 sm:px-8 lg:px-10" id="universo-activo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {activeUniverse === "mega" ? (
            <h3 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
              <span className="text-amber-600">MEGA</span> Animals
            </h3>
          ) : (
            <h3 className="font-title text-3xl text-[var(--ink-900)]">{activeConfig.sectionTitle}</h3>
          )}
          {activeConfig.count > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={activeConfig.badgeClass}>{activeConfig.count} figuras</Badge>
              <Badge className={activeConfig.badgeClass}>
                Progreso {ownedActiveUniverseCount}/{activeUniverseCollection.length} · {ownedActiveUniversePercent}%
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Universo activo">
          <Button
            role="tab"
            aria-selected={activeUniverse === "animals"}
            size="sm"
            className={activeUniverse === "animals" ? activeTheme.primaryButton : undefined}
            variant={activeUniverse === "animals" ? "primary" : "secondary"}
            onClick={() => switchUniverse("animals", "active_universe_toggle")}
          >
            🌿 Animals
          </Button>
          <Button
            role="tab"
            aria-selected={activeUniverse === "mega"}
            size="sm"
            className={activeUniverse === "mega" ? activeTheme.primaryButton : undefined}
            variant={activeUniverse === "mega" ? "primary" : "secondary"}
            onClick={() => switchUniverse("mega", "active_universe_toggle")}
          >
            🦣 MEGA
          </Button>
          <Button
            role="tab"
            aria-selected={activeUniverse === "multiverse"}
            size="sm"
            className={activeUniverse === "multiverse" ? activeTheme.primaryButton : undefined}
            variant={activeUniverse === "multiverse" ? "primary" : "secondary"}
            onClick={() => switchUniverse("multiverse", "active_universe_toggle")}
          >
            ⚡ Multiverse
          </Button>
        </div>

        {activeConfig.count > 0 ? (
        <Card className={`mb-5 ${activeTheme.panelCard}`}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--ink-700)]">
              <span>Tu avance en {activeConfig.label}</span>
              <span className="font-black text-[var(--ink-900)]">{ownedActiveUniversePercent}%</span>
            </div>
            <Progress value={ownedActiveUniversePercent} />
            <p className="text-right text-xs text-[var(--ink-600)]">
              {ownedActiveUniverseCount} de {activeUniverseCollection.length} figuras
            </p>
            {ownedActiveUniverseCount > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-4">
                {CATALOG_RARITY_ORDER.map((rarity) => {
                  const stats = ownedByRarity[rarity];
                  const cfg = CATALOG_RARITY_CONFIG[rarity];
                  return (
                    <div
                      key={rarity}
                      className="flex items-center justify-between overflow-hidden rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                      style={{ backgroundColor: cfg.softColor, color: cfg.color }}
                    >
                      <span>{cfg.label}</span>
                      <span className="font-black">{stats.owned}/{stats.total}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
        ) : null}

        {activeUniverse === "mega" ? (
          /* MEGA: individual figures, no mystery packs */
          <Card className={`overflow-hidden border-0 bg-[linear-gradient(135deg,#fde8d0,#f8d0a8,#f0b870)] shadow-[0_18px_34px_rgba(180,90,20,0.22)]`}>
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
              <div className="flex-1 space-y-1">
                <h4 className="font-title text-2xl text-[#5a3610]">Elige tu figura MEGA</h4>
                <p className="text-sm text-[#7a4e14]">Las figuras MEGA se compran individualmente. Escoge la que más te guste en la tienda.</p>
              </div>
              <Button asChild className="shrink-0 bg-[linear-gradient(135deg,#b06a18,#d49a1a)] text-white shadow-sm">
                <a href={shopUrl}>
                  <ShoppingCartIcon className="h-4 w-4" /> Ver figuras MEGA
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {activeConfig.packs.map((pack) => {
            const Icon = pack.icon;
            const packCardClass = pack.cardClassName;

            return (
              <Card
                key={pack.name}
                className={`overflow-hidden border-0 ${packCardClass} ${dark ? (activeUniverse === "animals" ? "ink-light" : "ink-light-blue") : ""}`}
              >
                <CardContent className="space-y-2 p-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-title text-2xl text-[var(--ink-900)]">{pack.name}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[var(--ink-900)]">
                      <Icon className="h-4 w-4" /> {pack.pieces}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--ink-700)]">{pack.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}
      </section>


      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="catalogo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {activeUniverse === "mega" ? (
            <h3 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
              Catálogo <span className="text-amber-600">MEGA</span>
            </h3>
          ) : (
            <h3 className="font-title text-3xl text-[var(--ink-900)]">Catálogo de {activeConfig.label}</h3>
          )}
          {activeConfig.count > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={activeConfig.badgeClass}>{activeCatalogCards.length} animales base visibles</Badge>
              <Badge className={activeConfig.badgeClass}>
                {activeBaseModelStats.baseCount} base · {activeBaseModelStats.variantCount} variantes
              </Badge>
              <Badge className={activeConfig.badgeClass}>
                Colección total {ownedTotalCount}/{featuredCollection.length} · {ownedTotalPercent}%
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-[var(--ink-500)]">
            {filteredCollection.length > 0 ? <><span className="font-semibold text-[var(--ink-700)]">{filteredCollection.length}</span> figuras en {activeConfig.label}</> : null}
          </p>
          <Button asChild size="sm" variant="secondary" className="shrink-0">
            <a href={shopUrl} onClick={() => handlePurchaseIntent({ source: "catalog_universe_buy", packSize: activeUniverse === "mega" ? undefined : 15 })}>
              <ShoppingCartIcon className="h-3.5 w-3.5" /> {activeUniverse === "mega" ? "Comprar figuras" : "Comprar x15"}
            </a>
          </Button>
        </div>

        <Card className={`sticky top-0 z-20 ${activeTheme.panelCard}`} style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
          <CardContent className="space-y-3 p-3 sm:p-4">
            {/* Universe tabs + search in one row on lg */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Universe segmented control */}
              <div className="flex shrink-0 overflow-hidden rounded-full border border-black/[0.08] bg-black/[0.04] p-0.5">
                <button
                  role="tab"
                  aria-selected={activeUniverse === "animals"}
                  type="button"
                  onClick={() => switchUniverse("animals", "catalog_toggle")}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    activeUniverse === "animals"
                      ? `text-white shadow-sm ${activeTheme.primaryButton}`
                      : "text-[var(--ink-600)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <span className="relative z-10">🌿 Animals</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeUniverse === "mega"}
                  type="button"
                  onClick={() => switchUniverse("mega", "catalog_toggle")}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    activeUniverse === "mega"
                      ? `text-white shadow-sm ${activeTheme.primaryButton}`
                      : "text-[var(--ink-600)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <span className="relative z-10">🦣 Mega Animals</span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeUniverse === "multiverse"}
                  type="button"
                  onClick={() => switchUniverse("multiverse", "catalog_toggle")}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    activeUniverse === "multiverse"
                      ? `text-white shadow-sm ${activeTheme.primaryButton}`
                      : "text-[var(--ink-600)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <span className="relative z-10">⚡ Multiverse</span>
                </button>
              </div>
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    const nextQuery = event.target.value.slice(0, 80);
                    setSearchQuery(nextQuery);
                    setVisiblePages(1);
                  }}
                  placeholder="Buscar…"
                  className="pl-9 pr-8"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => { setSearchQuery(""); setDebouncedSearchQuery(""); setVisiblePages(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--ink-400)] transition hover:text-[var(--ink-900)]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Rarity pills */}
            <div
              role="tablist"
              aria-label="Filtro de rareza"
              className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible"
            >
              {RARITY_FILTER_OPTIONS.map((option) => {
                const isActive = rarityFilter === option.value;
                const count = rarityCountMap[option.value] ?? 0;

                return (
                  <Button
                    key={option.value}
                    role="tab"
                    aria-selected={isActive}
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className={`relative shrink-0 overflow-hidden ${isActive ? activeTheme.primaryButton : ""}`}
                    onClick={() => applyRarityFilter(option.value, "catalog_rarity")}
                  >
                    <span className="relative z-10 flex items-center gap-1">
                    {option.label}
                    {count > 0 ? (
                      <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                        {count}
                      </span>
                    ) : null}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!isAuthenticatedViewer ? (
          <Card className={`mt-4 ${activeTheme.panelCard}`}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-[var(--ink-700)]">
                Guarda tu avance creando tu cuenta con Google. Asi no pierdes qué Doflins ya encontraste.
              </p>
              <Button size="sm" className={activeTheme.primaryButton} disabled={isAuthActionLoading} onClick={() => void handleUserLogin()}>
                {isAuthActionLoading ? "Abriendo..." : "Crear cuenta con Google"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div
          className={`mt-5 ${activeUniverse === "mega" ? "mega-card-grid" : "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]"}`}
        >
          {isLoadingCollection
            ? Array.from({ length: activeUniverse === "mega" ? 4 : 8 }, (_, skI) => (
                <div
                  key={`skel-${skI}`}
                  className={`space-y-3 overflow-hidden rounded-[2rem] border p-3.5 ${activeConfig.cardClass}`}
                >
                  <div className={`${activeUniverse === "mega" ? "h-[200px] sm:h-[220px]" : "h-[132px] sm:h-[145px]"} animate-pulse rounded-xl bg-black/[0.07]`} />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-black/[0.06]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-black/[0.05]" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-14 animate-pulse rounded-full bg-black/[0.06]" />
                    <div className="h-5 w-12 animate-pulse rounded-full bg-black/[0.05]" />
                  </div>
                  <div className="mt-2 h-8 animate-pulse rounded-full bg-black/[0.07]" />
                </div>
              ))
            : visibleCards.map((item, index) => {
            const modelConfig = MODEL_CONFIG_BY_COLLECTION[item.collectionNumber];
            const isOwned = ownedSet.has(item.id);
            const itemIsOriginal = isOriginalVariant(item.variantName);
            const itemGroupStats = activeBaseModelStats.map.get(baseModelKey(item));
            const itemVariantLabel = variantLabel(item.variantName);

            return (
              <div
                key={item.id}
                className={`transition-transform duration-200 ${activeUniverse === "mega" ? "mega-card-scale" : "hover:-translate-y-1.5 hover:scale-[1.025]"} active:scale-[0.97]`}
                style={
                  activeUniverse === "mega"
                    ? { animation: `mega-card-entrance 0.5s cubic-bezier(0.34,1.56,0.64,1) both`, animationDelay: `${Math.min(index, 5) * 0.12}s` }
                    : index < 12 ? { animation: `fadeInUp 0.3s ease both`, animationDelay: `${Math.min(index, 11) * 0.04}s` } : undefined
                }
              >
              <Card
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: activeUniverse === "mega" ? "0 380px" : "0 280px",
                  boxShadow: RARITY_GLOW_CSS[item.rarity] ?? undefined,
                }}
                className={`relative overflow-hidden rounded-[2rem] border ${activeConfig.cardClass} ${isOwned ? "ring-2 ring-[var(--brand-primary)]/40" : ""}`}
              >
                {/* Mega ambient glow behind card */}
                {activeUniverse === "mega" ? <div className="mega-ambient-glow" /> : null}

                {item.rarity === "LEGENDARY" || item.rarity === "ULTRA" || item.rarity === "MYTHIC" ? (
                  <RarityParticles rarity={item.rarity} />
                ) : null}
                <CardContent className="flex h-full flex-col space-y-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => handleOpenCard(item)}
                    className="relative block w-full cursor-pointer text-left"
                    aria-label={`Abrir vista de ${item.name}`}
                  >
                    {isOwned && isAuthenticatedViewer ? (
                      <span className="animate-sparkle-pop absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] shadow-lg">
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      </span>
                    ) : null}

                    {/* Mega XL badge */}
                    {activeUniverse === "mega" ? (
                      <span className="mega-xl-pulse absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                        XL
                      </span>
                    ) : null}

                    <div className={activeUniverse === "mega" ? "mega-card-image-overflow" : ""}>
                      <Figure3D
                        src={item.imageUrl}
                        fallbackSrc={FALLBACK_DOFLIN_IMAGE}
                        alt={item.name}
                        rarity={item.rarity}
                        eager={index < 8}
                        imageClassName={activeUniverse === "mega"
                          ? "h-[200px] w-[200px] sm:h-[220px] sm:w-[220px] mx-auto"
                          : "h-[132px] w-[132px] sm:h-[145px] sm:w-[145px] mx-auto"
                        }
                        className="rounded-[1.25rem] p-2.5"
                        modelUrl={modelConfig?.modelUrl}
                        modelOrientation={modelConfig?.orientation}
                        modelCameraOrbit={modelConfig?.cameraOrbit}
                        modelFieldOfView={modelConfig?.fieldOfView}
                        lazyModel={index >= 4}
                      />
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col space-y-1">
                    <p className="truncate font-semibold text-[var(--ink-900)]">{item.name}</p>
                    <p className="truncate text-xs text-[var(--ink-700)]">{item.baseModel}</p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <Badge
                        className={`w-fit text-[10px] uppercase tracking-[0.08em] ${
                          itemIsOriginal
                            ? "bg-[#eaf5d8] text-[#2f5b1f] ring-1 ring-[#c6dba0]"
                            : "bg-[#e9efff] text-[#2f448f] ring-1 ring-[#c9d6ff]"
                        }`}
                      >
                        {itemIsOriginal ? "Animal original" : "Variante"}
                      </Badge>
                      <Badge className="w-fit bg-white/90 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-700)] ring-1 ring-black/10">
                        {itemVariantLabel}
                      </Badge>
                      {(itemGroupStats?.total ?? 1) > 1 ? (
                        <Badge className="w-fit bg-white/90 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-700)] ring-1 ring-black/10">
                          {(itemGroupStats?.total ?? 1).toString()} versiones
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-[var(--ink-600)]">{item.series}</p>
                    <p className="text-xs text-[var(--ink-600)]">#{String(item.collectionNumber).padStart(2, "0")}</p>
                    <Badge className="w-fit bg-white/80 text-[10px] uppercase tracking-[0.08em] text-[var(--ink-700)] ring-1 ring-black/10">
                      Imagen oficial
                    </Badge>
                    <RarityPill rarity={item.rarity} />
                    <div className="mt-auto space-y-2 pt-2">
                      <Badge
                        className={`${isOwned && isAuthenticatedViewer ? activeConfig.badgeClass : "bg-[#f2f6e6] text-[#6a7852] ring-1 ring-[#cad4b1]"} max-w-full whitespace-normal text-[11px] leading-tight sm:text-xs`}
                      >
                        {isAuthenticatedViewer ? (isOwned ? "GUARDADO EN TU PROGRESO" : "PENDIENTE DE GUARDAR") : "PENDIENTE DE GUARDAR"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={isOwned ? "secondary" : "primary"}
                        className={isOwned ? "h-8 w-full" : `h-8 w-full ${activeTheme.primaryButton}`}
                        onClick={() => {
                          if (!isAuthenticatedViewer) {
                            requestAuthForProgress();
                            return;
                          }
                          if (isOwned) {
                            clearOwnedMark(item.id);
                            return;
                          }
                          markAsOwned(item.id);
                        }}
                      >
                        {isOwned ? "Quitar progreso" : "Guardar progreso"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            );
          })}
        </div>

        {hasMoreCards ? <div ref={loadMoreRef} className="mt-4 h-1 w-full" /> : null}

        {hasMoreCards ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="flex items-center gap-2 text-sm text-[var(--ink-600)]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              Cargando más figuras...
            </p>
            <Button variant="secondary" size="sm" onClick={() => setVisiblePages((value) => value + 1)}>
              Cargar más ahora
            </Button>
          </div>
        ) : null}

        {!isLoadingCollection && activeCatalogCards.length === 0 ? (
          <Card className={`mt-5 ${activeTheme.panelCard}`}>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              {activeConfig.count === 0 ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.06] text-3xl">🚀</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--ink-900)]">Próximamente</p>
                    <p className="text-sm text-[var(--ink-700)]">
                      Estamos preparando las figuras de {activeConfig.label}. ¡Vuelve pronto!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.06] text-3xl">🔍</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--ink-900)]">Sin resultados</p>
                    <p className="text-sm text-[var(--ink-700)]">
                      No hay figuras{rarityFilter !== "all" ? ` con rareza ${CATALOG_RARITY_CONFIG[rarityFilter as CatalogRarity]?.label}` : ""}
                      {searchQuery.trim() ? ` para "${searchQuery.trim()}"` : ""}.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setDebouncedSearchQuery("");
                      setRarityFilter("all");
                      setVisiblePages(1);
                    }}
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" /> Limpiar filtros
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10" id="rareza">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Sistema de rareza</h3>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${dark ? "" : "text-[var(--ink-700)]"} ${activeTheme.rarityInfoChip}`}>
            <FireIcon className="h-4 w-4 text-orange-600" />
            Quedan {remainingLegendaryCount ?? "--"} legendarias sin descubrir
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATALOG_RARITY_ORDER.map((rarity) => (
            <Card key={rarity} className={activeTheme.rarityCard}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-title text-xl text-[var(--ink-900)]">{CATALOG_RARITY_CONFIG[rarity].label}</h4>
                  <span
                    className="rounded-full px-2 py-1 text-xs font-bold"
                    style={{
                      color: CATALOG_RARITY_CONFIG[rarity].color,
                      backgroundColor: CATALOG_RARITY_CONFIG[rarity].softColor,
                    }}
                  >
                    {CATALOG_RARITY_CONFIG[rarity].probability}%
                  </span>
                </div>
                <p className="text-sm text-[var(--ink-700)]">{CATALOG_RARITY_CONFIG[rarity].description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="guia">
        <h3 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Guía rápida para coleccionar</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={activeTheme.panelCard}>
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">1. Escanea y entra</p>
              <p className="font-semibold text-[var(--ink-900)]">Tu QR abre el catálogo oficial</p>
              <p className="text-sm text-[var(--ink-700)]">
                En segundos ves los universos disponibles, rarezas y figuras activas del momento.
              </p>
            </CardContent>
          </Card>
          <Card className={activeTheme.panelCard}>
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">2. Explora y elige</p>
              <p className="font-semibold text-[var(--ink-900)]">Filtra por universo y rareza</p>
              <p className="text-sm text-[var(--ink-700)]">
                Cambia entre Animals y Multiverse, aplica filtros y revisa qué figuras te faltan.
              </p>
            </CardContent>
          </Card>
          <Card className={activeTheme.panelCard}>
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">3. Guarda tu progreso</p>
              <p className="font-semibold text-[var(--ink-900)]">Marca los Doflins que ya tienes</p>
              <p className="text-sm text-[var(--ink-700)]">
                Con cuenta activa puedes respaldar tu colección y continuar en cualquier dispositivo.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10" id="plataforma">
        <h3 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Todo lo que necesitas para coleccionar</h3>
        <Card className={`mb-4 ${activeTheme.platformCard}`}>
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Cuenta coleccionista</p>
            <p className="font-semibold text-[var(--ink-900)]">Crea tu cuenta y respalda tu progreso</p>
            <p className="text-sm text-[var(--ink-700)]">
              Inicia sesión para registrar tus Doflins encontrados y mantener tu progreso sincronizado entre dispositivos.
            </p>
            {isAuthenticatedViewer ? (
              <p className="text-xs font-semibold text-[var(--ink-700)]">Sesión activa: {viewerEmail ?? "coleccionista"}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className={activeTheme.primaryButton}
                disabled={isAuthActionLoading}
                onClick={() => (isAuthenticatedViewer ? scrollToSection("catalogo") : void handleUserLogin())}
              >
                {isAuthenticatedViewer ? "Continuar mi colección" : isAuthActionLoading ? "Abriendo..." : "Crear cuenta / Iniciar sesión"}
              </Button>
              <Button asChild variant="secondary" size="sm">
                <a href={tikTokUrl} target="_blank" rel="noreferrer">
                  Avisarme cuando salga
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <CubeIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Solo lo que puedes comprar</p>
              <p className="text-sm text-[var(--ink-700)]">Mostramos únicamente packs con stock real. Sin decepciones al llegar al pago.</p>
            </CardContent>
          </Card>
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <InformationCircleIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Animals y Multiverse por separado</p>
              <p className="text-sm text-[var(--ink-700)]">Cambia de universo sin perder el hilo. Cada colección en su propio espacio.</p>
            </CardContent>
          </Card>
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <TicketIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Paga sin crear cuenta</p>
              <p className="text-sm text-[var(--ink-700)]">Agrega al carrito y paga en Shopify seguro. No necesitas registrarte.</p>
            </CardContent>
          </Card>
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <SparklesIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Encuentra tu figura en segundos</p>
              <p className="text-sm text-[var(--ink-700)]">Busca por nombre o filtra por rareza. El catálogo siempre ordenado.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <LazySection>
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">¿Cuántas figuras quieres hoy?</h3>
          <p className="mt-1 text-sm text-[var(--ink-700)]">Elige el pack que mejor se adapte a tu ritmo de colección.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {BUY_PACK_OPTIONS.map((pack) => {
            const isRecommended = pack.packSize === 15;
            const meta = packPrices[pack.packSize];
            return (
              <div
                key={pack.packSize}
                className={`group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                  isRecommended
                    ? "shadow-[0_12px_36px_rgba(78,111,42,0.28)]"
                    : "shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
                }`}
              >
                {/* Image hero with overlay */}
                <div className="relative h-52 w-full overflow-hidden bg-[var(--surface-100)]">
                  {meta?.imageUrl ? (
                    <Image
                      src={meta.imageUrl}
                      alt={meta.productTitle}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`absolute inset-0 ${activeTheme.primaryButton} opacity-30`} />
                  )}
                  {/* dark gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top badges */}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {isRecommended ? (
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white ${activeTheme.primaryButton}`}>
                        ⭐ Más popular
                      </span>
                    ) : null}
                    {!meta?.availableForSale && meta ? (
                      <span className="rounded-full bg-red-500/90 px-3 py-1 text-[10px] font-bold uppercase text-white">Agotado</span>
                    ) : meta ? (
                      <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">Disponible</span>
                    ) : null}
                  </div>

                  {/* Big pack size bottom-left */}
                  <div className="absolute bottom-3 left-4 flex items-end gap-1.5 drop-shadow-lg">
                    <span className="font-title text-[4rem] leading-none text-white">{pack.packSize}</span>
                    <span className="mb-1.5 text-base font-semibold text-white/80">figuras</span>
                  </div>

                  {/* Price bottom-right */}
                  {meta ? (
                    <div className="absolute bottom-3 right-4 text-right drop-shadow-lg">
                      <p className="font-title text-2xl leading-none text-white">
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: meta.currencyCode, maximumFractionDigits: 0 }).format(Number(meta.amount))}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{meta.currencyCode}</p>
                    </div>
                  ) : null}
                </div>

                {/* Content */}
                <div className={`flex flex-1 flex-col p-5 ${activeTheme.panelCard} ${isRecommended ? `border-2 border-[var(--brand-primary)]` : "border border-[#d7cfb0]"} rounded-b-3xl border-t-0`}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-500)]">{pack.subtitle}</p>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--ink-700)]">{pack.benefit}</p>

                  {/* Estimador de probabilidad */}
                  <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Figuras esperadas por rareza">
                    {CATALOG_RARITY_ORDER.map((rarity) => {
                      const cfg = CATALOG_RARITY_CONFIG[rarity];
                      const expected = Math.round((pack.packSize * cfg.probability) / 100 * 10) / 10;
                      if (expected < 0.5) return null;
                      return (
                        <span
                          key={rarity}
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{ background: cfg.softColor, color: cfg.color, outline: `1px solid ${cfg.color}40` }}
                          title={`~${expected} figura${expected === 1 ? "" : "s"} ${cfg.label}`}
                        >
                          ~{expected} {cfg.label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2">
                    {meta?.variantId ? (
                      <AddToCartButton
                        variantId={meta.variantId}
                        productTitle={meta.productTitle}
                        isSoldOut={!meta.availableForSale}
                        label={`Agregar ${pack.packSize} figuras al carrito`}
                        className={isRecommended ? activeTheme.primaryButton : "bg-[var(--ink-900)] hover:brightness-125"}
                        onClick={() => handlePurchaseIntent({ source: `packs_section_${pack.packSize}`, packSize: pack.packSize })}
                      />
                    ) : (
                      <Button
                        asChild
                        variant={isRecommended ? undefined : "ghost"}
                        className={`w-full ${isRecommended ? activeTheme.primaryButton : "bg-[var(--ink-900)] !text-white hover:brightness-125"}`}
                      >
                        <a href={shopUrl} onClick={() => handlePurchaseIntent({ source: `packs_section_${pack.packSize}`, packSize: pack.packSize })}>
                          <ShoppingCartIcon className="h-4 w-4" /> Comprar {pack.packSize} figuras
                        </a>
                      </Button>
                    )}
                    <a
                      href={shopUrl}
                      onClick={() => handlePurchaseIntent({ source: `packs_section_detail_${pack.packSize}`, packSize: pack.packSize })}
                      className="block text-center text-xs text-[var(--ink-500)] transition hover:text-[var(--ink-800)] hover:underline"
                    >
                      Ver en tienda →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-5xl px-5 sm:px-8 lg:px-10">
        <Card className={`overflow-hidden border-0 text-white ${activeTheme.ctaCard}`}>
          <CardContent className="space-y-5 p-8 text-center sm:p-10">
            <p className="text-sm uppercase tracking-[0.24em] text-white/80">Siguiente paso</p>
            <h3 className="font-title text-3xl sm:text-4xl">{activeConfig.ctaTitle}</h3>
            <p className="mx-auto max-w-2xl text-white/85">Selecciona tu universo favorito o combínalos para completar todo el catálogo.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="ghost" className={`bg-white hover:bg-slate-100 ${ctaPrimaryButtonTextClass}`} size="lg">
                <a
                  href={shopUrl}
                  onClick={() => handlePurchaseIntent({ source: "footer_buy", packSize: 15 })}
                >
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar ahora
                </a>
              </Button>
              <Link href="#catalogo">
                <Button variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                  <TicketIcon className="h-5 w-5" /> Ver catálogo
                </Button>
              </Link>
              <Button asChild variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                <a href={tikTokUrl} target="_blank" rel="noreferrer">
                  <BoltIcon className="h-5 w-5" /> Síguenos en TikTok
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      </LazySection>

      <DoflinModal
        selectedDoflin={selectedDoflin}
        onClose={() => setSelectedDoflin(null)}
        catalog={activeCatalogCards}
        catalogIndex={selectedDoflinIndexInCatalog}
        onNavigate={(item) => setSelectedDoflin(item)}
        has3DModel={selectedDoflinHas3DModel}
        modelConfig={selectedDoflinModelConfig}
        purchaseUniverse={selectedPurchaseUniverse}
        rarityConfig={selectedDoflinRarityConfig}
        isOriginal={selectedDoflinIsOriginal}
        isOwned={selectedDoflinIsOwned}
        groupStats={selectedDoflinGroupStats}
        variants={selectedDoflinVariants}
        imageSrc={selectedDoflinImageSrc}
        shopUrl={selectedShopUrl}
        isAuthenticated={isAuthenticatedViewer}
        isDark={dark}
        theme={activeTheme}
        onShare={() => void handleShareDoflin()}
        onMarkOwned={markAsOwned}
        onClearOwned={clearOwnedMark}
        onPurchaseIntent={handlePurchaseIntent}
        onRequestAuth={requestAuthForProgress}
        brokenImageIds={brokenModalImageIds}
        onImageBroken={setBrokenModalImageIds}
        brokenVariantImageIds={brokenVariantImageIds}
        onVariantImageBroken={setBrokenVariantImageIds}
      />
      <AuthPromptDialog
        isOpen={isAuthPromptOpen}
        isLoading={isAuthActionLoading}
        theme={activeTheme}
        onClose={() => setIsAuthPromptOpen(false)}
        onLogin={() => void handleUserLogin()}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-[var(--background)] px-3 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2.5 md:hidden">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          {activeUniverse === "mega" ? (
            /* MEGA: direct buy button without pack chips */
            <Button asChild className={`h-10 flex-1 ${activeTheme.primaryButton}`}>
              <a
                href={shopUrl}
                onClick={() => handlePurchaseIntent({ source: "sticky_mobile_buy" })}
              >
                <ShoppingCartIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">Comprar figuras MEGA</span>
              </a>
            </Button>
          ) : (
            <>
              {/* Pack size chips */}
              <div className="flex shrink-0 gap-1">
                {BUY_PACK_OPTIONS.map((pack) => {
                  const isSelected = selectedPackSize === pack.packSize;
                  return (
                    <button
                      key={pack.packSize}
                      type="button"
                      onClick={() => setSelectedPackSize(pack.packSize)}
                      className={`relative flex h-9 min-w-[48px] items-center justify-center rounded-full px-3 text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? `${activeTheme.primaryButton} text-white shadow-sm`
                          : "bg-black/[0.06] text-[var(--ink-700)] hover:bg-black/[0.1]"
                      }`}
                    >
                      ×{pack.packSize}
                      {pack.packSize === 15 && !isSelected ? (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Buy CTA */}
              <Button asChild className={`h-10 flex-1 ${activeTheme.primaryButton}`}>
                <a
                  href={shopUrl}
                  onClick={() => handlePurchaseIntent({ source: "sticky_mobile_buy", packSize: selectedPackSize })}
                >
                  <ShoppingCartIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">Comprar ×{selectedPackSize}</span>
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}