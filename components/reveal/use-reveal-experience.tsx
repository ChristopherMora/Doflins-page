"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingCartIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { pushDataLayerEvent } from "@/lib/analytics";
import {
  CATALOG_RARITY_CONFIG,
  toCatalogRarity,
  type CatalogRarity,
} from "@/lib/constants/rarity";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CollectionItemDTO, PackSize, Rarity } from "@/lib/types/doflin";
import { ensureModelViewer } from "@/components/reveal/figure-3d";

import {
  ACTIVE_SERIES,
  ANIMALS_PACKS,
  CATALOG_PAGE_SIZE,
  MEGA_PACKS,
  MODEL_CONFIG_BY_COLLECTION,
  MULTIVERSE_PACKS,
  UNIVERSE_STORAGE_KEY,
} from "./constants";
import { UNIVERSE_THEME_DARK, UNIVERSE_THEME_LIGHT } from "./themes";
import type {
  AdminStatusPayload,
  CollectionPayload,
  ProgressPayload,
  RarityFilter,
  RemainingPayload,
  TrackedEvent,
  Universe,
} from "./types";
import {
  baseModelKey,
  isOriginalVariant,
  normalizeOwnedIds,
  normalizeSeries,
  toRarityFilter,
  toUniverse,
  universeFromSeries,
} from "./utils";

interface UseRevealExperienceArgs {
  initialCollection?: CollectionItemDTO[];
  initialRemaining?: Record<Rarity, number>;
  dark: boolean;
}

export function useRevealExperience({
  initialCollection,
  initialRemaining,
  dark,
}: UseRevealExperienceArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const initialUniverse = toUniverse(searchParams.get("universe")) ?? "animals";
  const initialRarityFilter = toRarityFilter(searchParams.get("rarity")) ?? "all";
  const initialQuery = (searchParams.get("q") ?? "").slice(0, 80);

  const [activeUniverse, setActiveUniverse] = useState<Universe>(initialUniverse);
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>(initialRarityFilter);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedPackSize, setSelectedPackSize] = useState<PackSize>(15);
  const [visiblePages, setVisiblePages] = useState(1);
  const [selectedDoflin, setSelectedDoflin] = useState<CollectionItemDTO | null>(null);
  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [brokenModalImageIds, setBrokenModalImageIds] = useState<number[]>([]);
  const [brokenVariantImageIds, setBrokenVariantImageIds] = useState<Set<number>>(new Set());
  const [collection, setCollection] = useState<CollectionItemDTO[]>(initialCollection ?? []);
  const [isLoadingCollection, setIsLoadingCollection] = useState(initialCollection == null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialQuery);
  const [catalogAnimKey, setCatalogAnimKey] = useState(0);
  const [remaining, setRemaining] = useState<Record<Rarity, number> | null>(initialRemaining ?? null);
  const [, setIsAdminViewer] = useState(false);
  const [isAuthenticatedViewer, setIsAuthenticatedViewer] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showMegaIntro, setShowMegaIntro] = useState(false);
  const [megaRumble, setMegaRumble] = useState(false);
  const megaIntroShownRef = useRef<Set<string>>(new Set());
  const [packPrices, setPackPrices] = useState<Record<number, { amount: string; currencyCode: string; variantId: string; productTitle: string; availableForSale: boolean; imageUrl: string | null }>>({});

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/shop/products?universe=${activeUniverse}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const products = (data as { products?: Array<{ title: string; availableForSale: boolean; imageUrl: string | null; price: { amount: string; currencyCode: string }; variants: Array<{ id: string; availableForSale: boolean }> }> }).products ?? [];
        const map: Record<number, { amount: string; currencyCode: string; variantId: string; productTitle: string; availableForSale: boolean; imageUrl: string | null }> = {};
        for (const product of products) {
          const match = /\b(5|15|30)\b/.exec(product.title);
          if (match) {
            const size = Number(match[1]) as 5 | 15 | 30;
            if (!map[size]) {
              map[size] = {
                ...product.price,
                variantId: product.variants[0]?.id ?? "",
                productTitle: product.title,
                availableForSale: product.availableForSale,
                imageUrl: product.imageUrl,
              };
            }
          }
        }
        if (Object.keys(map).length > 0) setPackPrices(map);
      })
      .catch(() => null);
  }, [activeUniverse]);

  useEffect(() => {
    if (initialUniverse === "mega") {
      megaIntroShownRef.current.add("initial");
      setShowMegaIntro(true);
      setMegaRumble(true);
      setTimeout(() => setMegaRumble(false), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMegaIntroComplete = useCallback(() => setShowMegaIntro(false), []);

  // ─── Collection memos ─────────────────────────────────────────────────────

  const featuredCollection = useMemo(() => {
    const subset = collection.filter((item) =>
      ACTIVE_SERIES.some((seriesName) => normalizeSeries(seriesName) === normalizeSeries(item.series)),
    );
    return subset.length ? subset : collection;
  }, [collection]);

  const animalsCollection = useMemo(
    () => featuredCollection.filter((item) => normalizeSeries(item.series) === "animals"),
    [featuredCollection],
  );

  const multiverseCollection = useMemo(
    () => featuredCollection.filter((item) => normalizeSeries(item.series) === "multiverse"),
    [featuredCollection],
  );

  const megaCollection = useMemo(
    () => featuredCollection.filter((item) => normalizeSeries(item.series) === "megaanimals"),
    [featuredCollection],
  );

  const collectionCounts = useMemo(
    () => ({
      animals: animalsCollection.length,
      multiverse: multiverseCollection.length,
      mega: megaCollection.length,
    }),
    [animalsCollection.length, multiverseCollection.length, megaCollection.length],
  );

  const filteredCollection = useMemo(() => {
    const normalizedSearch = debouncedSearchQuery.trim().toLowerCase();
    return featuredCollection
      .filter((item) => {
        if (rarityFilter !== "all" && toCatalogRarity(item.rarity) !== rarityFilter) return false;
        if (!normalizedSearch) return true;
        const byName = item.name.toLowerCase().includes(normalizedSearch);
        const bySeries = item.series.toLowerCase().includes(normalizedSearch);
        const byNumber = String(item.collectionNumber).includes(normalizedSearch);
        return byName || bySeries || byNumber;
      })
      .sort((a, b) => a.collectionNumber - b.collectionNumber);
  }, [featuredCollection, rarityFilter, debouncedSearchQuery]);

  const animalsFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "animals"),
    [filteredCollection],
  );

  const multiverseFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "multiverse"),
    [filteredCollection],
  );

  const megaFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "megaanimals"),
    [filteredCollection],
  );

  // ─── Active config ────────────────────────────────────────────────────────

  const activeConfig = useMemo(
    () => {
      if (activeUniverse === "animals") {
        return {
            label: "Animals",
            sectionTitle: "Sección Doflins Animals",
            packs: ANIMALS_PACKS,
            cards: animalsFiltered,
            count: collectionCounts.animals,
            badgeClass: dark
              ? "bg-[#edf4d8] text-[#2d3c24] ring-1 ring-[#c9da9a]"
              : "bg-[#edf4d8] text-[var(--ink-800)] ring-1 ring-[#c9da9a]",
            cardClass: dark
              ? "ink-light border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)]"
              : "border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)]",
            ctaTitle: "Colecciona la fauna completa",
        };
      }
      if (activeUniverse === "mega") {
        return {
            label: "MEGA",
            sectionTitle: "Sección MEGA",
            packs: MEGA_PACKS,
            cards: megaFiltered,
            count: collectionCounts.mega,
            badgeClass: dark
              ? "bg-[#fff4d8] text-[#7a4e14] ring-1 ring-[#d8b870]"
              : "bg-[#fff4d8] text-[#7a4e14] ring-1 ring-[#d8b870]",
            cardClass: dark
              ? "ink-light border-[#e8cc90] bg-[linear-gradient(180deg,#fff8e4,#f8ead0)]"
              : "border-[#e8cc90] bg-[linear-gradient(180deg,#fff8e4,#f8ead0)]",
            ctaTitle: "Completa tu colección MEGA",
        };
      }
      return {
            label: "Multiverse",
            sectionTitle: "Sección Doflins Multiverse",
            packs: MULTIVERSE_PACKS,
            cards: multiverseFiltered,
            count: collectionCounts.multiverse,
            badgeClass: dark
              ? "bg-[#e9efff] text-[#253278] ring-1 ring-[#c8d3f4]"
              : "bg-[#e9efff] text-[var(--ink-800)] ring-1 ring-[#c8d3f4]",
            cardClass: dark
              ? "ink-light-blue border-[#ccd2e8] bg-[linear-gradient(180deg,#eff3ff,#e4e9fb)]"
              : "border-[#ccd2e8] bg-[linear-gradient(180deg,#eff3ff,#e4e9fb)]",
            ctaTitle: "Activa tu salto Multiverse",
      };
    },
    [activeUniverse, animalsFiltered, collectionCounts.animals, collectionCounts.multiverse, collectionCounts.mega, dark, multiverseFiltered, megaFiltered],
  );

  const activeTheme = (dark ? UNIVERSE_THEME_DARK : UNIVERSE_THEME_LIGHT)[activeUniverse];
  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);
  const activeUniverseCollection =
    activeUniverse === "animals" ? animalsCollection :
    activeUniverse === "mega" ? megaCollection :
    multiverseCollection;

  const activeBaseModelStats = useMemo(() => {
    const map = new Map<string, { total: number; originals: number; variants: number }>();
    for (const item of activeUniverseCollection) {
      const key = baseModelKey(item);
      const current = map.get(key) ?? { total: 0, originals: 0, variants: 0 };
      current.total += 1;
      if (isOriginalVariant(item.variantName)) {
        current.originals += 1;
      } else {
        current.variants += 1;
      }
      map.set(key, current);
    }
    return {
      map,
      baseCount: map.size,
      variantCount: Array.from(map.values()).reduce((total, entry) => total + entry.variants, 0),
    };
  }, [activeUniverseCollection]);

  const ownedTotalCount = useMemo(
    () => featuredCollection.reduce((total, item) => total + (ownedSet.has(item.id) ? 1 : 0), 0),
    [featuredCollection, ownedSet],
  );
  const ownedActiveUniverseCount = useMemo(
    () => activeUniverseCollection.reduce((total, item) => total + (ownedSet.has(item.id) ? 1 : 0), 0),
    [activeUniverseCollection, ownedSet],
  );
  const ownedTotalPercent = featuredCollection.length
    ? Math.round((ownedTotalCount / featuredCollection.length) * 100)
    : 0;
  const ownedActiveUniversePercent = activeUniverseCollection.length
    ? Math.round((ownedActiveUniverseCount / activeUniverseCollection.length) * 100)
    : 0;

  const ownedByRarity = useMemo(() => {
    const result: Record<CatalogRarity, { owned: number; total: number }> = {
      COMMON: { owned: 0, total: 0 },
      RARE: { owned: 0, total: 0 },
      EPIC: { owned: 0, total: 0 },
      LEGENDARY: { owned: 0, total: 0 },
    };
    for (const item of activeUniverseCollection) {
      const rarity = toCatalogRarity(item.rarity);
      result[rarity].total += 1;
      if (ownedSet.has(item.id)) {
        result[rarity].owned += 1;
      }
    }
    return result;
  }, [activeUniverseCollection, ownedSet]);

  // ─── Selected doflin derived ──────────────────────────────────────────────

  const selectedDoflinModelConfig = selectedDoflin
    ? MODEL_CONFIG_BY_COLLECTION[selectedDoflin.collectionNumber]
    : undefined;
  const selectedDoflinHas3DModel = Boolean(selectedDoflinModelConfig?.modelUrl);
  const selectedDoflinCatalogRarity = selectedDoflin ? toCatalogRarity(selectedDoflin.rarity) : null;
  const selectedDoflinRarityConfig = selectedDoflinCatalogRarity ? CATALOG_RARITY_CONFIG[selectedDoflinCatalogRarity] : null;
  const selectedDoflinIsOwned = selectedDoflin ? ownedSet.has(selectedDoflin.id) : false;
  const selectedDoflinGroupStats = selectedDoflin ? activeBaseModelStats.map.get(baseModelKey(selectedDoflin)) : undefined;
  const selectedDoflinIsOriginal = selectedDoflin ? isOriginalVariant(selectedDoflin.variantName) : false;
  const selectedPurchaseUniverse = selectedDoflin ? universeFromSeries(selectedDoflin.series) : activeUniverse;
  const selectedDoflinImageSrc =
    selectedDoflin && brokenModalImageIds.includes(selectedDoflin.id)
      ? "/images/placeholders/doflin-placeholder.svg"
      : selectedDoflin?.imageUrl ?? "/images/placeholders/doflin-placeholder.svg";
  const remainingLegendaryCount = useMemo(() => {
    if (!remaining) return null;
    return (remaining.LEGENDARY ?? 0) + (remaining.ULTRA ?? 0) + (remaining.MYTHIC ?? 0);
  }, [remaining]);
  const selectedDoflinVariants = useMemo(() => {
    if (!selectedDoflin) return [];
    const key = baseModelKey(selectedDoflin);
    return activeUniverseCollection
      .filter((item) => baseModelKey(item) === key)
      .sort((a, b) => {
        const aOriginal = isOriginalVariant(a.variantName);
        const bOriginal = isOriginalVariant(b.variantName);
        if (aOriginal !== bOriginal) return aOriginal ? -1 : 1;
        return a.collectionNumber - b.collectionNumber;
      });
  }, [activeUniverseCollection, selectedDoflin]);

  const activeCatalogCards = useMemo(() => {
    const grouped = new Map<string, CollectionItemDTO[]>();
    for (const item of activeConfig.cards) {
      const key = baseModelKey(item);
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    }
    const representatives = Array.from(grouped.values()).map((group) => {
      const ordered = [...group].sort((a, b) => a.collectionNumber - b.collectionNumber);
      return ordered.find((item) => isOriginalVariant(item.variantName)) ?? ordered[0];
    });
    return representatives.sort((a, b) => a.collectionNumber - b.collectionNumber);
  }, [activeConfig.cards]);

  const visibleCardCount = visiblePages * CATALOG_PAGE_SIZE;
  const visibleCards = useMemo(
    () => activeCatalogCards.slice(0, visibleCardCount),
    [activeCatalogCards, visibleCardCount],
  );
  const hasMoreCards = visibleCardCount < activeCatalogCards.length;

  const selectedDoflinIndexInCatalog = useMemo(
    () => (selectedDoflin ? activeCatalogCards.findIndex((item) => item.id === selectedDoflin.id) : -1),
    [activeCatalogCards, selectedDoflin],
  );
  const rarityCountMap = useMemo(() => {
    const map: Record<string, number> = { all: activeCatalogCards.length };
    for (const item of activeCatalogCards) {
      const r = toCatalogRarity(item.rarity);
      map[r] = (map[r] ?? 0) + 1;
    }
    return map;
  }, [activeCatalogCards]);

  // ─── Theme vars ───────────────────────────────────────────────────────────

  const themeVars = useMemo((): React.CSSProperties => {
    if (activeUniverse === "animals") {
      return dark
        ? {
            "--background": "#101a0a",
            "--foreground": "#d8f0b4",
            "--surface-100": "#182210",
            "--surface-200": "#1e2e18",
            "--ink-900": "#e8f4cf",
            "--ink-800": "#c6dbaa",
            "--ink-700": "#a8c87e",
            "--ink-600": "#88aa56",
            "--brand-primary": "#90d054",
            "--brand-accent": "#a0e068",
            "--brand-sky": "#e8b060",
          } as React.CSSProperties
        : {
            "--background": "#f6f2df",
            "--foreground": "#222d1a",
            "--surface-100": "#fff8e7",
            "--surface-200": "#e8eed7",
            "--ink-900": "#1f2a1a",
            "--ink-800": "#2d3c24",
            "--ink-700": "#445538",
            "--ink-600": "#64785a",
            "--brand-primary": "#4e6f2a",
            "--brand-accent": "#6c8a35",
            "--brand-sky": "#cc8b33",
          } as React.CSSProperties;
    }
    return dark
      ? {
          "--background": "#060c22",
          "--foreground": "#dce8ff",
          "--surface-100": "#0c1540",
          "--surface-200": "#121e54",
          "--ink-900": "#dce8ff",
          "--ink-800": "#c4d4ff",
          "--ink-700": "#a0b8f0",
          "--ink-600": "#7890d0",
          "--brand-primary": "#8094f8",
          "--brand-accent": "#a0b4ff",
          "--brand-sky": "#b4c8ff",
        } as React.CSSProperties
      : {
          "--background": "#e9eeff",
          "--foreground": "#141d3c",
          "--surface-100": "#f3f6ff",
          "--surface-200": "#e4eafe",
          "--ink-900": "#101b3e",
          "--ink-800": "#263363",
          "--ink-700": "#445187",
          "--ink-600": "#6877ab",
          "--brand-primary": "#4a62b5",
          "--brand-accent": "#6a7fdb",
          "--brand-sky": "#94a6ff",
        } as React.CSSProperties;
  }, [activeUniverse, dark]);

  // ─── Callbacks ────────────────────────────────────────────────────────────

  const scrollToSection = useCallback(
    (sectionId: "universo-activo" | "rareza" | "catalogo" | "plataforma" | "guia") => {
      const target = document.getElementById(sectionId);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  useEffect(() => {
    if (initialCollection != null && initialRemaining != null) {
      setIsLoadingCollection(false);
      return;
    }
    async function loadCatalogData(): Promise<void> {
      try {
        const [collectionResponse, statsResponse] = await Promise.all([
          fetch("/api/collection", { cache: "no-store" }),
          fetch("/api/stats/remaining", { cache: "no-store" }),
        ]);
        if (collectionResponse.ok) {
          const collectionPayload = (await collectionResponse.json()) as CollectionPayload;
          setCollection(collectionPayload.collection);
        }
        if (statsResponse.ok) {
          const statsPayload = (await statsResponse.json()) as RemainingPayload;
          setRemaining(statsPayload.remaining);
        }
      } catch {
        setCollection([]);
      } finally {
        setIsLoadingCollection(false);
      }
    }
    void loadCatalogData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOwnedProgress = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/progress", { cache: "no-store" });
      if (response.status === 401) { setOwnedIds([]); return; }
      if (!response.ok) throw new Error("No se pudo cargar tu progreso.");
      const payload = (await response.json()) as ProgressPayload;
      setOwnedIds(normalizeOwnedIds(payload.ownedIds));
    } catch {
      setOwnedIds([]);
    }
  }, []);

  const refreshViewerStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/admin-status", { cache: "no-store" });
      if (!response.ok) {
        setIsAdminViewer(false); setIsAuthenticatedViewer(false); setViewerEmail(null); setOwnedIds([]);
        return;
      }
      const payload = (await response.json()) as AdminStatusPayload;
      setIsAdminViewer(payload.isAdmin);
      setIsAuthenticatedViewer(payload.isAuthenticated);
      setViewerEmail(payload.userEmail);
      if (payload.isAuthenticated) { await loadOwnedProgress(); } else { setOwnedIds([]); }
    } catch {
      setIsAdminViewer(false); setIsAuthenticatedViewer(false); setViewerEmail(null); setOwnedIds([]);
    }
  }, [loadOwnedProgress]);

  useEffect(() => { void refreshViewerStatus(); }, [refreshViewerStatus]);

  const trackEvent = useCallback(
    (eventType: TrackedEvent, payload: Record<string, unknown>): void => {
      pushDataLayerEvent(eventType, { eventAlias: eventType, ...payload });
      void fetch("/api/events/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          source: typeof payload.source === "string" ? payload.source : "reveal_ui",
          doflinId: typeof payload.doflinId === "number" ? payload.doflinId : undefined,
          universe: typeof payload.universe === "string" ? payload.universe : activeUniverse,
          rarity: typeof payload.rarity === "string" ? payload.rarity : rarityFilter,
          query: typeof payload.query === "string" ? payload.query.slice(0, 80) : undefined,
        }),
        keepalive: true,
      }).catch(() => null);
    },
    [activeUniverse, rarityFilter],
  );

  const switchUniverse = useCallback(
    (target: Universe, source: string, sectionId?: "universo-activo" | "catalogo") => {
      if (activeUniverse !== target) {
        trackEvent("universe_switch", { source, universe: target, fromUniverse: activeUniverse });
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(UNIVERSE_STORAGE_KEY, target);
      }
      setVisiblePages(1);
      setActiveUniverse(target);
      setCatalogAnimKey((k) => k + 1);
      if (target === "mega" && !megaIntroShownRef.current.has(source)) {
        megaIntroShownRef.current.add(source);
        setShowMegaIntro(true);
        setMegaRumble(true);
        setTimeout(() => setMegaRumble(false), 400);
      }
      if (sectionId) scrollToSection(sectionId);
    },
    [activeUniverse, scrollToSection, trackEvent],
  );

  const applyRarityFilter = useCallback(
    (nextFilter: RarityFilter, source: string) => {
      if (rarityFilter !== nextFilter) {
        trackEvent("filter_apply", { source, rarity: nextFilter, universe: activeUniverse });
      }
      setVisiblePages(1);
      setRarityFilter(nextFilter);
    },
    [activeUniverse, rarityFilter, trackEvent],
  );

  const handleUserLogin = useCallback(async (): Promise<void> => {
    setIsAuthActionLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const redirectTo = `${origin}/auth/user/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;
    } catch (error) {
      setIsAuthActionLoading(false);
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUserLogout = useCallback(async (): Promise<void> => {
    setIsAuthActionLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setOwnedIds([]); setIsAuthenticatedViewer(false); setViewerEmail(null); setIsAdminViewer(false);
      toast.success("Sesión cerrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar sesión.");
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const saveOwnedStatus = useCallback(
    async (doflinId: number, owned: boolean): Promise<void> => {
      if (!isAuthenticatedViewer) {
        toast("Inicia sesión para guardar tu progreso", {
          description: "Tu colección se sincroniza solo con cuenta.",
          icon: <SparklesIcon className="h-4 w-4" />,
        });
        return;
      }
      const previous = ownedIds;
      const next = owned ? (previous.includes(doflinId) ? previous : [...previous, doflinId]) : previous.filter((id) => id !== doflinId);
      setOwnedIds(next);
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doflinId, owned }),
        });
        if (response.status === 401) {
          setOwnedIds(previous); setIsAuthenticatedViewer(false); setViewerEmail(null);
          toast("Inicia sesión para guardar tu progreso.");
          return;
        }
        if (!response.ok) throw new Error("No se pudo guardar tu progreso.");
      } catch {
        setOwnedIds(previous);
        toast.error("No se pudo sincronizar tu progreso.");
      }
    },
    [isAuthenticatedViewer, ownedIds],
  );

  const markAsOwned = useCallback((doflinId: number) => { void saveOwnedStatus(doflinId, true); }, [saveOwnedStatus]);
  const clearOwnedMark = useCallback((doflinId: number) => { void saveOwnedStatus(doflinId, false); }, [saveOwnedStatus]);
  const requestAuthForProgress = useCallback(() => { setIsAuthPromptOpen(true); }, []);

  // ─── URL & localStorage sync ──────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("universe", activeUniverse);
    if (rarityFilter !== "all") params.set("rarity", rarityFilter.toLowerCase());
    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery) params.set("q", normalizedQuery);
    const nextUrl = `${pathname}?${params.toString()}`;
    router.replace(nextUrl, { scroll: false });
  }, [activeUniverse, pathname, rarityFilter, router, searchQuery]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(UNIVERSE_STORAGE_KEY) : null;
    const fromUrl = searchParams.get("universe");
    if (!fromUrl && saved) {
      const parsed = toUniverse(saved);
      if (parsed && parsed !== activeUniverse) setActiveUniverse(parsed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDoflin) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = activeCatalogCards[selectedDoflinIndexInCatalog + 1];
        if (next) setSelectedDoflin(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = activeCatalogCards[selectedDoflinIndexInCatalog - 1];
        if (prev) setSelectedDoflin(prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeCatalogCards, selectedDoflin, selectedDoflinIndexInCatalog]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMoreCards) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setVisiblePages((previous) => {
          const maxPages = Math.max(1, Math.ceil(activeConfig.cards.length / CATALOG_PAGE_SIZE));
          return Math.min(previous + 1, maxPages);
        });
      },
      { rootMargin: "240px 0px", threshold: 0.05 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeConfig.cards.length, hasMoreCards]);

  useEffect(() => {
    if (!selectedDoflinModelConfig?.modelUrl) return;
    void ensureModelViewer().catch(() => null);
  }, [selectedDoflinModelConfig?.modelUrl]);

  // ─── Shop URLs ────────────────────────────────────────────────────────────

  const tikTokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com";
  const shopUrl = `/?universe=${activeUniverse}#compras`;
  const selectedShopUrl = `/?universe=${selectedPurchaseUniverse}#compras`;

  const handleShareDoflin = useCallback(async () => {
    if (!selectedDoflin) return;
    const url = `${window.location.origin}/carta/${selectedDoflin.id}`;
    const title = `${selectedDoflin.name} — DOFLINS`;
    const text = `¡Encontré un ${selectedDoflin.rarity.toLowerCase()} en mi colección DOFLINS! 🐾`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado al portapapeles");
      }
    } catch {
      // user cancelled share
    }
  }, [selectedDoflin]);

  const handlePurchaseIntent = useCallback((options?: {
    source?: string;
    packSize?: PackSize;
    doflinId?: number;
  }) => {
    const source = options?.source ?? "catalog_cta";
    toast("Abriendo compra...", {
      description: "Elige tu universo y continúa con tu colección.",
      icon: <ShoppingCartIcon className="h-4 w-4" />,
    });
    pushDataLayerEvent("PurchaseIntent", {
      source,
      universe: activeUniverse,
      packSize: options?.packSize,
      doflinId: options?.doflinId,
      eventAlias: "purchase_intent",
    });
    void fetch("/api/events/purchase-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        doflinId: options?.doflinId,
        packSize: options?.packSize,
      }),
      keepalive: true,
    }).catch(() => null);
  }, [activeUniverse]);

  const handleOpenCard = useCallback(
    (item: CollectionItemDTO) => {
      setSelectedDoflin(item);
      trackEvent("card_open", { source: "catalog_card", doflinId: item.id, universe: activeUniverse });
    },
    [activeUniverse, trackEvent],
  );

  const handleModal3DView = useCallback(() => {
    if (!selectedDoflin) return;
    trackEvent("view_3d", { source: "catalog_modal", doflinId: selectedDoflin.id, universe: activeUniverse });
  }, [activeUniverse, selectedDoflin, trackEvent]);

  useEffect(() => {
    if (!selectedDoflin || !selectedDoflinModelConfig?.modelUrl) return;
    handleModal3DView();
  }, [handleModal3DView, selectedDoflin, selectedDoflinModelConfig?.modelUrl]);

  const mainInkScopeClass = !dark
    ? activeUniverse === "animals"
      ? "ink-light"
      : "ink-light-blue"
    : "";
  const ctaPrimaryButtonTextClass =
    activeUniverse === "animals" ? "!text-[#1f3b12]" : "!text-[#243271]";

  return {
    // Refs
    loadMoreRef,
    // State
    activeUniverse,
    rarityFilter,
    searchQuery,
    setSearchQuery,
    selectedPackSize,
    setSelectedPackSize,
    visiblePages,
    setVisiblePages,
    selectedDoflin,
    setSelectedDoflin,
    brokenModalImageIds,
    setBrokenModalImageIds,
    brokenVariantImageIds,
    setBrokenVariantImageIds,
    isLoadingCollection,
    debouncedSearchQuery,
    setDebouncedSearchQuery,
    catalogAnimKey,
    isAuthenticatedViewer,
    viewerEmail,
    isAuthActionLoading,
    isAuthPromptOpen,
    setIsAuthPromptOpen,
    isOffline,
    showMegaIntro,
    megaRumble,
    packPrices,
    // Derived
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
    // Callbacks
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
    dark,
    remaining,
  };
}
