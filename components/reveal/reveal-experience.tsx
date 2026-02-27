"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bars3Icon,
  BoltIcon,
  CheckCircleIcon,
  CubeIcon,
  FireIcon,
  FunnelIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TicketIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { pushDataLayerEvent } from "@/lib/analytics";
import { RARITY_CONFIG, RARITY_ORDER, rarityLabel } from "@/lib/constants/rarity";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CollectionItemDTO, PackSize, Rarity } from "@/lib/types/doflin";
import { ensureModelViewer, Figure3D } from "@/components/reveal/figure-3d";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

const FALLBACK_DOFLIN_IMAGE = "/images/placeholders/doflin-placeholder.svg";
const ACTIVE_SERIES = ["Animals", "Multiverse"] as const;

type Universe = "animals" | "multiverse";
type RarityFilter = "all" | Rarity;

interface CollectionPayload {
  status: "ok";
  collection: CollectionItemDTO[];
}

interface RemainingPayload {
  status: "ok";
  remaining: Record<Rarity, number>;
  totalRemaining: number;
}

interface AdminStatusPayload {
  status: "ok";
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string | null;
}

interface ProgressPayload {
  status: "ok";
  ownedIds: number[];
}

interface PackOption {
  name: string;
  pieces: number;
  detail: string;
  icon: React.ElementType;
  cardClassName: string;
}

interface UniverseTheme {
  pageGlow: string;
  pageGradient: string;
  headerShell: string;
  logoGradient: string;
  primaryButton: string;
  pillButton: string;
  heroBadge: string;
  heroChip: string;
  heroStateCard: string;
  heroStateInfo: string;
  panelCard: string;
  rarityInfoChip: string;
  rarityCard: string;
  platformCard: string;
  ctaCard: string;
  ctaPrimaryText: string;
  heroTitle: string;
  heroDescription: string;
  heroTag: string;
  qrNarrative: string;
}

interface DoflinModelConfig {
  modelUrl: string;
  orientation?: string;
  cameraOrbit?: string;
  fieldOfView?: string;
}

interface BuyPackOption {
  packSize: PackSize;
  title: string;
  subtitle: string;
  benefit: string;
}

type TrackedEvent = "universe_switch" | "filter_apply" | "card_open" | "view_3d";

const ANIMALS_PACKS: PackOption[] = [
  {
    name: "Explorador",
    pieces: 5,
    detail: "Entrada rápida a la colección Animals",
    icon: MapIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#eef4d9,#deecbe,#c9de9f)] shadow-[0_18px_34px_rgba(98,121,58,0.2)]",
  },
  {
    name: "Safari",
    pieces: 15,
    detail: "Balance ideal entre variedad y costo",
    icon: GlobeAltIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#ffeccf,#ffdcae,#f6c889)] shadow-[0_18px_34px_rgba(170,112,37,0.2)]",
  },
  {
    name: "Salvaje",
    pieces: 30,
    detail: "La experiencia más completa de fauna",
    icon: FireIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#ffe2cf,#ffc79e,#f49b6d)] shadow-[0_18px_34px_rgba(172,83,42,0.24)]",
  },
];

const MULTIVERSE_PACKS: PackOption[] = [
  {
    name: "Portal",
    pieces: 5,
    detail: "Primer salto a variantes de Multiverse",
    icon: RocketLaunchIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#e9f3ff,#d7e8ff,#c4dbff)] shadow-[0_18px_34px_rgba(58,92,156,0.2)]",
  },
  {
    name: "Nexo",
    pieces: 15,
    detail: "Más posibilidades de rarezas altas",
    icon: SparklesIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#e6ecff,#d7ddff,#c7ccff)] shadow-[0_18px_34px_rgba(77,82,164,0.22)]",
  },
  {
    name: "Omniverse",
    pieces: 30,
    detail: "Pack premium para cazar épicos y más",
    icon: BoltIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#f0e9ff,#e2d7ff,#d3c6ff)] shadow-[0_18px_34px_rgba(104,76,158,0.22)]",
  },
];

const RARITY_FILTER_OPTIONS: { value: RarityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...RARITY_ORDER.map((rarity) => ({ value: rarity, label: rarityLabel(rarity) })),
];

const UNIVERSE_THEME: Record<Universe, UniverseTheme> = {
  animals: {
    pageGlow:
      "bg-[radial-gradient(circle_at_8%_10%,rgba(206,166,93,0.24),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(152,180,95,0.2),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(92,120,55,0.2),transparent_34%)]",
    pageGradient: "bg-[linear-gradient(180deg,#f8f4e6,#e9f0df_42%,#dbe7d8)]",
    headerShell: "border-[#efe2bf]/85 bg-[#fff8e7]/90 shadow-[0_10px_26px_rgba(86,89,39,0.18)]",
    logoGradient: "bg-[linear-gradient(135deg,#425f2d,#6f8740)]",
    primaryButton: "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]",
    pillButton: "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white",
    heroBadge: "border-[#e4d6af] bg-[#fff9ea] text-[var(--ink-700)] ring-1 ring-[#d6c79b]",
    heroChip: "border-[#e6d9b4] bg-[#fff8e8]",
    heroStateCard: "border-[#e8dcb8]/80 bg-[#fff9ea]/90 shadow-[0_18px_45px_rgba(89,79,30,0.18)]",
    heroStateInfo: "bg-white/90",
    panelCard: "border-[#e7dab8] bg-[#fff9ea]/90",
    rarityInfoChip: "bg-[#fff7df] ring-1 ring-[#d3c18f]",
    rarityCard: "border-[#e8dab4] bg-[#fff9e8]/88",
    platformCard: "border-[#dccc99] bg-[#fff8e7]/90",
    ctaCard: "bg-[linear-gradient(135deg,#3f5a27,#4f6a6f,#5f6cc1)] shadow-[0_25px_50px_rgba(49,67,58,0.45)]",
    ctaPrimaryText: "text-[#31481e]",
    heroTitle: "Catálogo Animals",
    heroDescription:
      "Tonos naturales, energía de selva y personajes inspirados en fauna. Aquí el universo se siente orgánico y coleccionable.",
    heroTag: "Universo Animals",
    qrNarrative: "Este QR te abre el catálogo oficial y tu progreso de colección.",
  },
  multiverse: {
    pageGlow:
      "bg-[radial-gradient(circle_at_10%_8%,rgba(129,161,255,0.26),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(162,121,255,0.24),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(72,111,207,0.2),transparent_30%)]",
    pageGradient: "bg-[linear-gradient(180deg,#eef2ff,#e6ebff_42%,#dde5ff)]",
    headerShell: "border-[#cfd8ff]/85 bg-[#f5f7ff]/90 shadow-[0_10px_26px_rgba(69,82,144,0.2)]",
    logoGradient: "bg-[linear-gradient(135deg,#3f57b1,#6a6ff0)]",
    primaryButton: "bg-[linear-gradient(135deg,#4a62b5,#5d74cf)]",
    pillButton: "bg-[linear-gradient(135deg,#4a62b5,#5d74cf)] text-white",
    heroBadge: "border-[#cad4ff] bg-[#eef2ff] text-[#3d4d8f] ring-1 ring-[#c4d0ff]",
    heroChip: "border-[#d1dbff] bg-[#f3f6ff]",
    heroStateCard: "border-[#d3ddff]/90 bg-[#f4f7ff]/92 shadow-[0_18px_45px_rgba(73,88,153,0.2)]",
    heroStateInfo: "bg-white/88",
    panelCard: "border-[#d7e0ff] bg-[#f6f8ff]/92",
    rarityInfoChip: "bg-[#eef3ff] ring-1 ring-[#c8d4ff]",
    rarityCard: "border-[#d2dcff] bg-[#f5f8ff]/92",
    platformCard: "border-[#cdd8ff] bg-[#f5f7ff]/94",
    ctaCard: "bg-[linear-gradient(135deg,#293c91,#4b58c2,#7c60d2)] shadow-[0_25px_50px_rgba(55,63,128,0.46)]",
    ctaPrimaryText: "text-[#2b3278]",
    heroTitle: "Catálogo Multiverse",
    heroDescription:
      "Paleta fría, vibe futurista y variantes de alto impacto. Es un universo más agresivo para cazadores de rareza.",
    heroTag: "Universo Multiverse",
    qrNarrative: "Desde aquí puedes cambiar de universo y guardar tu avance.",
  },
};

const BUY_PACK_OPTIONS: BuyPackOption[] = [
  {
    packSize: 1,
    title: "Pack x1",
    subtitle: "Entrada rápida",
    benefit: "Ideal para iniciar colección y validar el universo que más te gusta.",
  },
  {
    packSize: 3,
    title: "Pack x3",
    subtitle: "Balance recomendado",
    benefit: "Mejor combinación entre variedad de figuras y costo por bolsa.",
  },
  {
    packSize: 5,
    title: "Pack x5",
    subtitle: "Modo coleccionista",
    benefit: "Sube tus probabilidades de encontrar rarezas altas en menos compras.",
  },
];

const MODEL_CONFIG_BY_COLLECTION: Partial<Record<number, DoflinModelConfig>> = {
  1: {
    modelUrl: "/models/doflins/michael-myers-multicolor.glb?v=5",
    orientation: "90deg 0deg 0deg",
    cameraOrbit: "0deg 58deg auto",
    fieldOfView: "28deg",
  },
};

const CATALOG_PAGE_SIZE = 10;
function RarityPill({ rarity }: { rarity: Rarity }): React.JSX.Element {
  const config = RARITY_CONFIG[rarity];

  return (
    <Badge
      className="font-bold"
      style={{
        backgroundColor: config.softColor,
        color: rarity === "MYTHIC" ? "#4A3A18" : config.color,
      }}
    >
      {rarityLabel(rarity)}
    </Badge>
  );
}

function normalizeSeries(series: string): string {
  return series.trim().toLowerCase();
}

function toUniverse(value: string | null): Universe | null {
  if (!value) {
    return null;
  }

  return value === "animals" || value === "multiverse" ? value : null;
}

function toRarityFilter(value: string | null): RarityFilter | null {
  if (!value) {
    return null;
  }

  if (value === "all") {
    return "all";
  }

  const upper = value.toUpperCase() as Rarity;
  return RARITY_ORDER.includes(upper) ? upper : null;
}

function withPackQuery(baseUrl: string, packSize: PackSize): string {
  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set("pack", String(packSize));
    return parsed.toString();
  } catch {
    const join = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${join}pack=${packSize}`;
  }
}

function normalizeOwnedIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

export function RevealExperience(): React.JSX.Element {
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
  const [selectedPackSize, setSelectedPackSize] = useState<PackSize>(3);
  const [visiblePages, setVisiblePages] = useState(1);
  const [selectedDoflin, setSelectedDoflin] = useState<CollectionItemDTO | null>(null);
  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [collection, setCollection] = useState<CollectionItemDTO[]>([]);
  const [remaining, setRemaining] = useState<Record<Rarity, number> | null>(null);
  const [isAdminViewer, setIsAdminViewer] = useState(false);
  const [isAuthenticatedViewer, setIsAuthenticatedViewer] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

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

  const collectionCounts = useMemo(
    () => ({
      animals: animalsCollection.length,
      multiverse: multiverseCollection.length,
    }),
    [animalsCollection.length, multiverseCollection.length],
  );

  const filteredCollection = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return featuredCollection
      .filter((item) => {
        if (rarityFilter !== "all" && item.rarity !== rarityFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const byName = item.name.toLowerCase().includes(normalizedSearch);
        const bySeries = item.series.toLowerCase().includes(normalizedSearch);
        const byNumber = String(item.collectionNumber).includes(normalizedSearch);

        return byName || bySeries || byNumber;
      })
      .sort((a, b) => a.collectionNumber - b.collectionNumber);
  }, [featuredCollection, rarityFilter, searchQuery]);

  const animalsFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "animals"),
    [filteredCollection],
  );

  const multiverseFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "multiverse"),
    [filteredCollection],
  );

  const activeConfig = useMemo(
    () =>
      activeUniverse === "animals"
        ? {
            label: "Animals",
            sectionTitle: "Sección Doflins Animals",
            packs: ANIMALS_PACKS,
            cards: animalsFiltered,
            count: collectionCounts.animals,
            badgeClass: "bg-[#edf4d8] text-[var(--ink-800)] ring-1 ring-[#c9da9a]",
            cardClass: "border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)]",
            ctaTitle: "Colecciona la fauna completa",
          }
        : {
            label: "Multiverse",
            sectionTitle: "Sección Doflins Multiverse",
            packs: MULTIVERSE_PACKS,
            cards: multiverseFiltered,
            count: collectionCounts.multiverse,
            badgeClass: "bg-[#e9efff] text-[var(--ink-800)] ring-1 ring-[#c8d3f4]",
            cardClass: "border-[#ccd2e8] bg-[linear-gradient(180deg,#eff3ff,#e4e9fb)]",
            ctaTitle: "Activa tu salto Multiverse",
          },
    [activeUniverse, animalsFiltered, collectionCounts.animals, collectionCounts.multiverse, multiverseFiltered],
  );

  const activeTheme = UNIVERSE_THEME[activeUniverse];
  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);
  const activeUniverseCollection = activeUniverse === "animals" ? animalsCollection : multiverseCollection;
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
  const selectedDoflinModelConfig = selectedDoflin
    ? MODEL_CONFIG_BY_COLLECTION[selectedDoflin.collectionNumber]
    : undefined;
  const selectedDoflinIsOwned = selectedDoflin ? ownedSet.has(selectedDoflin.id) : false;
  const visibleCardCount = visiblePages * CATALOG_PAGE_SIZE;
  const visibleCards = useMemo(
    () => activeConfig.cards.slice(0, visibleCardCount),
    [activeConfig.cards, visibleCardCount],
  );
  const hasMoreCards = visibleCardCount < activeConfig.cards.length;

  const themeVars =
    activeUniverse === "animals"
      ? ({
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
        } as React.CSSProperties)
      : ({
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
        } as React.CSSProperties);

  const scrollToSection = useCallback(
    (
      sectionId: "universos" | "universo-activo" | "rareza" | "catalogo" | "plataforma" | "guia",
    ) => {
      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  useEffect(() => {
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
      }
    }

    void loadCatalogData();
  }, []);

  const loadOwnedProgress = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/progress", { cache: "no-store" });
      if (response.status === 401) {
        setOwnedIds([]);
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo cargar tu progreso.");
      }

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
        setIsAdminViewer(false);
        setIsAuthenticatedViewer(false);
        setViewerEmail(null);
        setOwnedIds([]);
        return;
      }

      const payload = (await response.json()) as AdminStatusPayload;
      setIsAdminViewer(payload.isAdmin);
      setIsAuthenticatedViewer(payload.isAuthenticated);
      setViewerEmail(payload.userEmail);

      if (payload.isAuthenticated) {
        await loadOwnedProgress();
      } else {
        setOwnedIds([]);
      }
    } catch {
      setIsAdminViewer(false);
      setIsAuthenticatedViewer(false);
      setViewerEmail(null);
      setOwnedIds([]);
    }
  }, [loadOwnedProgress]);

  useEffect(() => {
    void refreshViewerStatus();
  }, [refreshViewerStatus]);

  const trackEvent = useCallback(
    (eventType: TrackedEvent, payload: Record<string, unknown>): void => {
      pushDataLayerEvent(eventType, {
        eventAlias: eventType,
        ...payload,
      });

      void fetch("/api/events/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        trackEvent("universe_switch", {
          source,
          universe: target,
          fromUniverse: activeUniverse,
        });
      }

      setVisiblePages(1);
      setActiveUniverse(target);

      if (sectionId) {
        scrollToSection(sectionId);
      }
    },
    [activeUniverse, scrollToSection, trackEvent],
  );

  const applyRarityFilter = useCallback(
    (nextFilter: RarityFilter, source: string) => {
      if (rarityFilter !== nextFilter) {
        trackEvent("filter_apply", {
          source,
          rarity: nextFilter,
          universe: activeUniverse,
        });
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
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsAuthActionLoading(false);
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  }, []);

  const handleUserLogout = useCallback(async (): Promise<void> => {
    setIsAuthActionLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      setOwnedIds([]);
      setIsAuthenticatedViewer(false);
      setViewerEmail(null);
      setIsAdminViewer(false);
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doflinId,
            owned,
          }),
        });

        if (response.status === 401) {
          setOwnedIds(previous);
          setIsAuthenticatedViewer(false);
          setViewerEmail(null);
          toast("Inicia sesión para guardar tu progreso.");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudo guardar tu progreso.");
        }
      } catch {
        setOwnedIds(previous);
        toast.error("No se pudo sincronizar tu progreso.");
      }
    },
    [isAuthenticatedViewer, ownedIds],
  );

  const markAsOwned = useCallback(
    (doflinId: number) => {
      void saveOwnedStatus(doflinId, true);
    },
    [saveOwnedStatus],
  );

  const clearOwnedMark = useCallback(
    (doflinId: number) => {
      void saveOwnedStatus(doflinId, false);
    },
    [saveOwnedStatus],
  );

  const requestAuthForProgress = useCallback(() => {
    setIsAuthPromptOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (activeUniverse !== "animals") {
      params.set("universe", activeUniverse);
    }

    if (rarityFilter !== "all") {
      params.set("rarity", rarityFilter.toLowerCase());
    }

    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [activeUniverse, pathname, rarityFilter, router, searchQuery]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMoreCards) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisiblePages((previous) => {
          const maxPages = Math.max(1, Math.ceil(activeConfig.cards.length / CATALOG_PAGE_SIZE));
          return Math.min(previous + 1, maxPages);
        });
      },
      {
        rootMargin: "240px 0px",
        threshold: 0.05,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [activeConfig.cards.length, hasMoreCards]);

  useEffect(() => {
    if (!selectedDoflinModelConfig?.modelUrl) {
      return;
    }

    void ensureModelViewer().catch(() => null);
  }, [selectedDoflinModelConfig?.modelUrl]);

  const purchaseUrl = process.env.NEXT_PUBLIC_WOO_PRODUCT_URL ?? "https://dofer.mx";
  const tikTokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com";
  const purchaseUrlByPack = useMemo(
    () =>
      ({
        1: withPackQuery(purchaseUrl, 1),
        3: withPackQuery(purchaseUrl, 3),
        5: withPackQuery(purchaseUrl, 5),
      }) as Record<PackSize, string>,
    [purchaseUrl],
  );

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
      headers: {
        "Content-Type": "application/json",
      },
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
      trackEvent("card_open", {
        source: "catalog_card",
        doflinId: item.id,
        universe: activeUniverse,
      });
    },
    [activeUniverse, trackEvent],
  );

  const handleModal3DView = useCallback(() => {
    if (!selectedDoflin) {
      return;
    }

    trackEvent("view_3d", {
      source: "catalog_modal",
      doflinId: selectedDoflin.id,
      universe: activeUniverse,
    });
  }, [activeUniverse, selectedDoflin, trackEvent]);

  useEffect(() => {
    if (!selectedDoflin || !selectedDoflinModelConfig?.modelUrl) {
      return;
    }

    handleModal3DView();
  }, [handleModal3DView, selectedDoflin, selectedDoflinModelConfig?.modelUrl]);

  return (
    <main className="relative overflow-hidden pb-36 transition-colors duration-500 md:pb-24" style={themeVars}>
      <div className={`pointer-events-none absolute inset-0 -z-30 ${activeTheme.pageGlow}`} />
      <div className={`pointer-events-none absolute inset-0 -z-20 ${activeTheme.pageGradient}`} />

      <header className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-5 pt-4 sm:px-8 lg:px-10">
        <div className={`flex items-center justify-between rounded-full border px-3 py-2 backdrop-blur ${activeTheme.headerShell}`}>
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black text-white ${activeTheme.logoGradient}`}>
              DF
            </div>
            <p className="font-title text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">DOFLINS</p>
            <Badge className="hidden items-center gap-1 bg-white/85 text-[var(--ink-700)] ring-1 ring-black/10 sm:inline-flex">
              <SparklesIcon className="h-4 w-4" />
              Catálogo oficial
            </Badge>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--ink-700)] lg:flex">
            <button type="button" onClick={() => scrollToSection("universos")} className="transition hover:text-[var(--brand-primary)]">
              Universos
            </button>
            <button type="button" onClick={() => scrollToSection("rareza")} className="transition hover:text-[var(--brand-primary)]">
              Rareza
            </button>
            <button type="button" onClick={() => scrollToSection("catalogo")} className="transition hover:text-[var(--brand-primary)]">
              Catálogo
            </button>
            <button type="button" onClick={() => scrollToSection("guia")} className="transition hover:text-[var(--brand-primary)]">
              Guía rápida
            </button>
            <button type="button" onClick={() => scrollToSection("plataforma")} className="transition hover:text-[var(--brand-primary)]">
              Plataforma
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticatedViewer ? (
              <Badge className="hidden max-w-[150px] truncate bg-white/85 text-[var(--ink-700)] ring-1 ring-black/10 xl:inline-flex">
                {viewerEmail ?? "Cuenta activa"}
              </Badge>
            ) : (
              <Button variant="secondary" className="hidden h-11 px-4 md:inline-flex" disabled={isAuthActionLoading} onClick={() => void handleUserLogin()}>
                {isAuthActionLoading ? "Abriendo..." : "Iniciar sesión"}
              </Button>
            )}
            {isAdminViewer ? (
              <Link href="/admin/doflins" className="hidden md:block">
                <Button variant="secondary" className="h-11 px-4">
                  <ShieldCheckIcon className="h-4 w-4" /> Admin
                </Button>
              </Link>
            ) : null}
            {isAuthenticatedViewer ? (
              <Button variant="ghost" className="hidden h-11 px-3 text-sm md:inline-flex" onClick={() => void handleUserLogout()}>
                Salir
              </Button>
            ) : null}
            <a
              href={purchaseUrlByPack[3]}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:block"
              onClick={() => handlePurchaseIntent({ source: "header_buy", packSize: 3 })}
            >
              <Button className={`h-11 px-6 text-white hover:brightness-105 ${activeTheme.primaryButton}`}>Comprar</Button>
            </a>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="h-10 w-10 rounded-full p-0 lg:hidden">
                  <Bars3Icon className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[var(--surface-100)]">
                <SheetHeader>
                  <SheetTitle>DOFLINS</SheetTitle>
                  <SheetDescription>Navegación rápida</SheetDescription>
                </SheetHeader>
                <div className="space-y-2">
                  <SheetClose asChild>
                    {isAuthenticatedViewer ? (
                      <Button variant="secondary" className="w-full justify-start" onClick={() => void handleUserLogout()}>
                        Cerrar sesión
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full justify-start" onClick={() => void handleUserLogin()}>
                        Iniciar sesión
                      </Button>
                    )}
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("universos")}>
                      Universos
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => switchUniverse("animals", "menu", "universo-activo")}>
                      Animals
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => switchUniverse("multiverse", "menu", "universo-activo")}>
                      Multiverse
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("catalogo")}>
                      Catálogo
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("guia")}>
                      Guía rápida
                    </Button>
                  </SheetClose>
                  {isAdminViewer ? (
                    <SheetClose asChild>
                      <Link href="/admin/doflins">
                        <Button variant="secondary" className="w-full justify-start">
                          <ShieldCheckIcon className="h-4 w-4" /> Ir a admin
                        </Button>
                      </Link>
                    </SheetClose>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div className="space-y-6">
            <Badge className={activeTheme.heroBadge}>{activeTheme.heroTag}</Badge>
            <h1 className="font-title text-5xl leading-[0.95] tracking-tight text-[var(--ink-900)] sm:text-6xl">
              {activeTheme.heroTitle}
            </h1>
            <p className="max-w-2xl text-[1.15rem] leading-relaxed text-[var(--ink-700)]">
              {activeTheme.heroDescription}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className={`h-12 ${activeTheme.primaryButton}`} onClick={() => scrollToSection("universos")}>
                <SparklesIcon className="h-5 w-5" /> Explorar universos
              </Button>
              <Button variant="secondary" size="lg" className="h-12" onClick={() => scrollToSection("guia")}>
                <InformationCircleIcon className="h-5 w-5" /> Cómo coleccionar
              </Button>
              <a
                href={purchaseUrlByPack[3]}
                target="_blank"
                rel="noreferrer"
                onClick={() => handlePurchaseIntent({ source: "hero_buy", packSize: 3 })}
              >
                <Button variant="secondary" size="lg" className="h-12">
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar mystery bag
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-[var(--ink-700)]">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 ${activeTheme.heroChip}`}>
                <ShieldCheckIcon className="h-4 w-4 text-[var(--brand-primary)]" /> QR oficial verificado
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 ${activeTheme.heroChip}`}>
                <CubeIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Catálogo 3D por figura
              </span>
            </div>
          </div>

          <Card className={`overflow-hidden ${activeTheme.heroStateCard}`}>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Estado de colección</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#edf4d9,#d8eaaf)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Animals</p>
                  <p className="mt-1 text-3xl font-black text-[var(--ink-900)]">{collectionCounts.animals}</p>
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
                <p className="text-xs text-[var(--ink-600)]">
                  El progreso se guarda en tu cuenta. Si no inicias sesión, no se registra.
                </p>
              </div>

              <div className={`rounded-2xl p-4 text-sm text-[var(--ink-700)] ${activeTheme.heroStateInfo}`}>
                <p className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Plataforma conectada
                </p>
                <p className="mt-1">{activeTheme.qrNarrative}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10" id="universos">
        <h2 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Universos DOFLINS</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#f0f5dd,#dceab8,#c9de9f)] shadow-[0_18px_34px_rgba(85,117,54,0.2)]">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">Sección</p>
              <h3 className="font-title text-3xl text-[var(--ink-900)]">Doflins Animals</h3>
              <p className="text-[var(--ink-700)]">Fauna con personalidad, colores naturales y look safari/selva.</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white text-[var(--ink-900)]">{collectionCounts.animals} modelos</Badge>
                <Badge className="bg-white text-[var(--ink-900)]">Explorador / Safari / Salvaje</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className={activeTheme.pillButton} onClick={() => switchUniverse("animals", "universe_card", "universo-activo")}>
                  Activar Animals
                </Button>
                <Button variant="secondary" size="sm" onClick={() => switchUniverse("animals", "universe_card", "catalogo")}>
                  Ver catálogo Animals
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#e9efff,#d8e3ff,#c8d4ff)] shadow-[0_18px_34px_rgba(62,88,152,0.24)]">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">Sección</p>
              <h3 className="font-title text-3xl text-[var(--ink-900)]">Doflins Multiverse</h3>
              <p className="text-[var(--ink-700)]">Versiones alternas con estética futurista y rarezas de alto impacto.</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white text-[var(--ink-900)]">{collectionCounts.multiverse} modelos</Badge>
                <Badge className="bg-white text-[var(--ink-900)]">Portal / Nexo / Omniverse</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className={activeTheme.pillButton} onClick={() => switchUniverse("multiverse", "universe_card", "universo-activo")}>
                  Activar Multiverse
                </Button>
                <Button variant="secondary" size="sm" onClick={() => switchUniverse("multiverse", "universe_card", "catalogo")}>
                  Ver catálogo Multiverse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="universo-activo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">{activeConfig.sectionTitle}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={activeConfig.badgeClass}>{activeConfig.count} figuras</Badge>
            <Badge className={activeConfig.badgeClass}>
              Progreso {ownedActiveUniverseCount}/{activeUniverseCollection.length} · {ownedActiveUniversePercent}%
            </Badge>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            className={activeUniverse === "animals" ? activeTheme.primaryButton : undefined}
            variant={activeUniverse === "animals" ? "primary" : "secondary"}
            onClick={() => switchUniverse("animals", "active_universe_toggle")}
          >
            Ver Animals
          </Button>
          <Button
            size="sm"
            className={activeUniverse === "multiverse" ? activeTheme.primaryButton : undefined}
            variant={activeUniverse === "multiverse" ? "primary" : "secondary"}
            onClick={() => switchUniverse("multiverse", "active_universe_toggle")}
          >
            Ver Multiverse
          </Button>
        </div>

        <Card className={`mb-5 ${activeTheme.panelCard}`}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--ink-700)]">
              <span>Tu avance en {activeConfig.label}</span>
              <span>
                {ownedActiveUniverseCount}/{activeUniverseCollection.length} figuras
              </span>
            </div>
            <Progress value={ownedActiveUniversePercent} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {activeConfig.packs.map((pack) => {
            const Icon = pack.icon;

            return (
              <Card key={pack.name} className={`overflow-hidden border-0 ${pack.cardClassName}`}>
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
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10" id="rareza">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Sistema de rareza</h3>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--ink-700)] ${activeTheme.rarityInfoChip}`}>
            <FireIcon className="h-4 w-4 text-orange-600" />
            Quedan {remaining?.LEGENDARY ?? "--"} legendarios sin descubrir
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RARITY_ORDER.map((rarity) => (
            <Card key={rarity} className={activeTheme.rarityCard}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-title text-xl text-[var(--ink-900)]">{rarityLabel(rarity)}</h4>
                  <span
                    className="rounded-full px-2 py-1 text-xs font-bold"
                    style={{ color: RARITY_CONFIG[rarity].color, backgroundColor: RARITY_CONFIG[rarity].softColor }}
                  >
                    {RARITY_CONFIG[rarity].probability}%
                  </span>
                </div>
                <p className="text-sm text-[var(--ink-700)]">{RARITY_CONFIG[rarity].description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="catalogo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Catálogo de {activeConfig.label}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={activeConfig.badgeClass}>{activeConfig.cards.length} figuras visibles</Badge>
            <Badge className={activeConfig.badgeClass}>
              Colección total {ownedTotalCount}/{featuredCollection.length} · {ownedTotalPercent}%
            </Badge>
          </div>
        </div>

        <Card className={activeTheme.panelCard}>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className={activeUniverse === "animals" ? activeTheme.primaryButton : undefined}
                variant={activeUniverse === "animals" ? "primary" : "secondary"}
                onClick={() => switchUniverse("animals", "catalog_toggle")}
              >
                Mostrar Animals
              </Button>
              <Button
                size="sm"
                className={activeUniverse === "multiverse" ? activeTheme.primaryButton : undefined}
                variant={activeUniverse === "multiverse" ? "primary" : "secondary"}
                onClick={() => switchUniverse("multiverse", "catalog_toggle")}
              >
                Mostrar Multiverse
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-600)]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    const nextQuery = event.target.value.slice(0, 80);
                    setSearchQuery(nextQuery);
                    setVisiblePages(1);
                  }}
                  placeholder="Buscar por nombre, serie o número"
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
                <FunnelIcon className="h-4 w-4" /> Rareza
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {RARITY_FILTER_OPTIONS.map((option) => {
                const isActive = rarityFilter === option.value;

                return (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className={isActive ? activeTheme.primaryButton : undefined}
                    onClick={() => applyRarityFilter(option.value, "catalog_rarity")}
                  >
                    {option.label}
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

        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
          {visibleCards.map((item, index) => {
            const modelConfig = MODEL_CONFIG_BY_COLLECTION[item.collectionNumber];
            const isOwned = ownedSet.has(item.id);

            return (
              <Card
                key={item.id}
                className={`overflow-hidden border ${activeConfig.cardClass} ${isOwned ? "ring-2 ring-[var(--brand-primary)]/40 shadow-[0_12px_26px_rgba(29,50,103,0.2)]" : ""}`}
              >
                <CardContent className="flex h-full flex-col space-y-3 p-3">
                  <button
                    type="button"
                    onClick={() => handleOpenCard(item)}
                    className="block w-full cursor-pointer text-left"
                    aria-label={`Abrir vista de ${item.name}`}
                  >
                    <Figure3D
                      src={item.imageUrl}
                      fallbackSrc={FALLBACK_DOFLIN_IMAGE}
                      alt={item.name}
                      rarity={item.rarity}
                      imageClassName="h-[132px] sm:h-[145px]"
                      className="p-2"
                      modelUrl={modelConfig?.modelUrl}
                      modelOrientation={modelConfig?.orientation}
                      modelCameraOrbit={modelConfig?.cameraOrbit}
                      modelFieldOfView={modelConfig?.fieldOfView}
                      lazyModel={index >= 4}
                    />
                  </button>

                  <div className="flex flex-1 flex-col space-y-1">
                    <p className="truncate font-semibold text-[var(--ink-900)]">{item.name}</p>
                    <p className="truncate text-xs text-[var(--ink-700)]">
                      {item.baseModel} · {item.variantName}
                    </p>
                    <p className="text-xs text-[var(--ink-600)]">{item.series}</p>
                    <p className="text-xs text-[var(--ink-600)]">#{String(item.collectionNumber).padStart(2, "0")}</p>
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
            );
          })}
        </div>

        {hasMoreCards ? <div ref={loadMoreRef} className="mt-4 h-1 w-full" /> : null}

        {hasMoreCards ? (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => setVisiblePages((value) => value + 1)}>
              Cargar más figuras
            </Button>
          </div>
        ) : null}

        {activeConfig.cards.length === 0 ? (
          <Card className={`mt-5 ${activeTheme.panelCard}`}>
            <CardContent className="p-6 text-center">
              <p className="font-semibold text-[var(--ink-900)]">No encontramos figuras con ese filtro.</p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">Prueba otra búsqueda o quita filtros de rareza.</p>
            </CardContent>
          </Card>
        ) : null}
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
        <h3 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Plataforma y experiencia de usuario</h3>
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
              <a href={tikTokUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  Avisarme cuando salga
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <CubeIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">API en vivo</p>
              <p className="text-sm text-[var(--ink-700)]">Colección y stats cargan en tiempo real desde backend.</p>
            </CardContent>
          </Card>
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <InformationCircleIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">2 personalidades</p>
              <p className="text-sm text-[var(--ink-700)]">Cada universo se visualiza por separado con selector activo.</p>
            </CardContent>
          </Card>
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <TicketIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Tracking de compra</p>
              <p className="text-sm text-[var(--ink-700)]">CTA registra `purchase_intent` para medir conversión.</p>
            </CardContent>
          </Card>
          <Card className={activeTheme.platformCard}>
            <CardContent className="space-y-2 p-5">
              <SparklesIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Catálogo utilizable</p>
              <p className="text-sm text-[var(--ink-700)]">Búsqueda + rareza sin mezclar universos en pantalla.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Packs disponibles</h3>
          <Badge className={activeConfig.badgeClass}>x1 / x3 / x5</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {BUY_PACK_OPTIONS.map((pack) => (
            <Card key={pack.packSize} className={activeTheme.panelCard}>
              <CardContent className="space-y-3 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">{pack.subtitle}</p>
                <h4 className="font-title text-3xl text-[var(--ink-900)]">{pack.title}</h4>
                <p className="text-sm text-[var(--ink-700)]">{pack.benefit}</p>
                <a
                  href={purchaseUrlByPack[pack.packSize]}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    handlePurchaseIntent({
                      source: `packs_section_${pack.packSize}`,
                      packSize: pack.packSize,
                    })
                  }
                >
                  <Button className={`w-full ${activeTheme.primaryButton}`}>Comprar {pack.title}</Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-5xl px-5 sm:px-8 lg:px-10">
        <Card className={`overflow-hidden border-0 text-white ${activeTheme.ctaCard}`}>
          <CardContent className="space-y-5 p-8 text-center sm:p-10">
            <p className="text-sm uppercase tracking-[0.24em] text-white/80">Siguiente paso</p>
            <h3 className="font-title text-3xl sm:text-4xl">{activeConfig.ctaTitle}</h3>
            <p className="mx-auto max-w-2xl text-white/85">Selecciona tu universo favorito o combínalos para completar todo el catálogo.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={purchaseUrlByPack[3]}
                target="_blank"
                rel="noreferrer"
                onClick={() => handlePurchaseIntent({ source: "footer_buy", packSize: 3 })}
              >
                <Button className={`bg-white hover:bg-slate-100 ${activeTheme.ctaPrimaryText}`} size="lg">
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar ahora
                </Button>
              </a>
              <Link href="#catalogo">
                <Button variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                  <TicketIcon className="h-5 w-5" /> Ver catálogo
                </Button>
              </Link>
              <a href={tikTokUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                  <BoltIcon className="h-5 w-5" /> Síguenos en TikTok
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={Boolean(selectedDoflin)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDoflin(null);
          }
        }}
      >
        <DialogContent className="w-[min(96vw,980px)] gap-0 overflow-hidden p-0">
          {selectedDoflin ? (
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[320px] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,241,255,0.92))] p-4">
                {selectedDoflinModelConfig?.modelUrl ? (
                  <model-viewer
                    src={selectedDoflinModelConfig.modelUrl}
                    alt={selectedDoflin.name}
                    poster={selectedDoflin.imageUrl}
                    orientation={selectedDoflinModelConfig.orientation}
                    camera-orbit={selectedDoflinModelConfig.cameraOrbit ?? "0deg 60deg auto"}
                    field-of-view={selectedDoflinModelConfig.fieldOfView ?? "28deg"}
                    shadow-intensity="0.7"
                    exposure="1.2"
                    camera-controls
                    auto-rotate
                    interaction-prompt="none"
                    className="h-[360px] w-full"
                    style={{ background: "transparent", display: "block" }}
                  />
                ) : (
                  <Image
                    src={selectedDoflin.imageUrl}
                    alt={selectedDoflin.name}
                    width={780}
                    height={780}
                    className="h-[360px] w-full object-contain"
                    unoptimized
                  />
                )}
              </div>

              <div className="space-y-5 p-6">
                <DialogHeader>
                  <DialogTitle>{selectedDoflin.name}</DialogTitle>
                  <DialogDescription>
                    {selectedDoflin.baseModel} · {selectedDoflin.variantName} · Serie {selectedDoflin.series} · #
                    {String(selectedDoflin.collectionNumber).padStart(2, "0")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <RarityPill rarity={selectedDoflin.rarity} />
                  <Badge className={activeConfig.badgeClass}>{selectedDoflin.probability}% probabilidad</Badge>
                </div>
                <div className={`rounded-2xl border p-3 ${activeTheme.panelCard}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Estado en tu colección</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                    {isAuthenticatedViewer
                      ? selectedDoflinIsOwned
                        ? "Guardado en tu progreso"
                        : "Aun no guardado"
                      : "Crea tu cuenta con Google para guardar tu progreso"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className={`flex-1 ${selectedDoflinIsOwned ? activeTheme.primaryButton : ""}`}
                      variant={!isAuthenticatedViewer ? "secondary" : selectedDoflinIsOwned ? "primary" : "secondary"}
                      onClick={() => {
                        if (!isAuthenticatedViewer) {
                          requestAuthForProgress();
                          return;
                        }
                        markAsOwned(selectedDoflin.id);
                      }}
                    >
                      Guardar progreso
                    </Button>
                    {isAuthenticatedViewer ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        variant={!selectedDoflinIsOwned ? "primary" : "secondary"}
                        onClick={() => {
                          clearOwnedMark(selectedDoflin.id);
                        }}
                      >
                        Quitar progreso
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                  Vista extendida de la figura para revisar acabados, volumen y estilo antes de comprar más bolsas.
                </p>
                <div className="space-y-2">
                  <a
                    href={purchaseUrlByPack[3]}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      handlePurchaseIntent({
                        source: "modal_buy",
                        packSize: 3,
                        doflinId: selectedDoflin.id,
                      })
                    }
                  >
                    <Button className={`w-full ${activeTheme.primaryButton}`}>
                      <ShoppingCartIcon className="h-5 w-5" /> Comprar pack x3
                    </Button>
                  </a>
                  <a
                    href={purchaseUrlByPack[1]}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      handlePurchaseIntent({
                        source: "modal_buy",
                        packSize: 1,
                        doflinId: selectedDoflin.id,
                      })
                    }
                  >
                    <Button variant="secondary" className="w-full">
                      Comprar pack x1
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthPromptOpen} onOpenChange={setIsAuthPromptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guarda tu progreso con una cuenta</DialogTitle>
            <DialogDescription>
              Para guardar tu progreso necesitas una cuenta. Crea tu acceso con Google y sincroniza tus Doflins encontrados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button
              className={activeTheme.primaryButton}
              disabled={isAuthActionLoading}
              onClick={() => {
                setIsAuthPromptOpen(false);
                void handleUserLogin();
              }}
            >
              {isAuthActionLoading ? "Abriendo..." : "Continuar con Google"}
            </Button>
            <Button variant="secondary" onClick={() => setIsAuthPromptOpen(false)}>
              Ahora no
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[var(--surface-100)]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          <div className="flex gap-2">
            {BUY_PACK_OPTIONS.map((pack) => (
              <Button
                key={pack.packSize}
                size="sm"
                variant={selectedPackSize === pack.packSize ? "primary" : "secondary"}
                className={selectedPackSize === pack.packSize ? activeTheme.primaryButton : "flex-1"}
                onClick={() => setSelectedPackSize(pack.packSize)}
              >
                x{pack.packSize}
              </Button>
            ))}
          </div>
          <a
            href={purchaseUrlByPack[selectedPackSize]}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              handlePurchaseIntent({
                source: "sticky_mobile_buy",
                packSize: selectedPackSize,
              })
            }
          >
            <Button className={`h-11 w-full ${activeTheme.primaryButton}`}>
              <ShoppingCartIcon className="h-5 w-5" /> Comprar pack x{selectedPackSize}
            </Button>
          </a>
        </div>
      </div>

      <Toaster />
    </main>
  );
}
