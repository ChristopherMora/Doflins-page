"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bars3Icon,
  BoltIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  FireIcon,
  FunnelIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  RectangleStackIcon,
  RocketLaunchIcon,
  ShareIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TicketIcon,
  WifiIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { pushDataLayerEvent } from "@/lib/analytics";
import {
  CATALOG_RARITY_CONFIG,
  CATALOG_RARITY_ORDER,
  toCatalogRarity,
  type CatalogRarity,
} from "@/lib/constants/rarity";
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
import { LazySection } from "@/components/ui/lazy-section";

const FALLBACK_DOFLIN_IMAGE = "/images/placeholders/doflin-placeholder.svg";
const ACTIVE_SERIES = ["Animals", "Multiverse"] as const;
const UNIVERSE_STORAGE_KEY = "doflins_last_universe_v1";

type Universe = "animals" | "multiverse";
type RarityFilter = "all" | CatalogRarity;

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
  ...CATALOG_RARITY_ORDER.map((rarity) => ({
    value: rarity,
    label: CATALOG_RARITY_CONFIG[rarity].label,
  })),
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

function formatPackPrice(basePrice: { amount: string; currencyCode: string }, multiplier: number): string {
  const value = Number(basePrice.amount) * multiplier;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: basePrice.currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

const BUY_PACK_OPTIONS: BuyPackOption[] = [
  {
    packSize: 5,
    title: "Pack x5",
    subtitle: "Entrada rápida",
    benefit: "Ideal para iniciar tu colección y conocer el universo sin compromiso.",
  },
  {
    packSize: 15,
    title: "Pack x15",
    subtitle: "Balance recomendado",
    benefit: "Mayor variedad de figuras, mejor costo por unidad y más opciones de rareza.",
  },
  {
    packSize: 30,
    title: "Pack x30",
    subtitle: "Modo coleccionista",
    benefit: "Maximiza tus probabilidades de obtener rarezas altas y completa universos más rápido.",
  },
];

const MODEL_CONFIG_BY_COLLECTION: Partial<Record<number, DoflinModelConfig>> = {
};

const CATALOG_PAGE_SIZE = 10;
function RarityPill({ rarity }: { rarity: Rarity }): React.JSX.Element {
  const catalogRarity = toCatalogRarity(rarity);
  const config = CATALOG_RARITY_CONFIG[catalogRarity];

  return (
    <Badge
      className="font-bold"
      style={{
        backgroundColor: config.softColor,
        color: config.color,
      }}
    >
      {config.label}
    </Badge>
  );
}

function normalizeSeries(series: string): string {
  return series.trim().toLowerCase();
}

function baseModelKey(item: Pick<CollectionItemDTO, "series" | "baseModel">): string {
  return `${normalizeSeries(item.series)}::${item.baseModel.trim().toLowerCase()}`;
}

function isOriginalVariant(variantName: string): boolean {
  const normalized = variantName.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return ["original", "base", "clasico", "clásico", "default title", "default"].some((token) =>
    normalized.includes(token),
  );
}

function variantLabel(variantName: string): string {
  const cleaned = variantName.trim();
  if (!cleaned || isOriginalVariant(cleaned)) {
    return "Original";
  }

  return cleaned;
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

  const normalized = value.trim().toUpperCase();
  if (normalized === "ALL") {
    return "all";
  }

  if (normalized === "ULTRA" || normalized === "MYTHIC") {
    return "LEGENDARY";
  }

  return CATALOG_RARITY_ORDER.includes(normalized as CatalogRarity) ? (normalized as CatalogRarity) : null;
}

function universeFromSeries(series: string): Universe {
  return normalizeSeries(series) === "multiverse" ? "multiverse" : "animals";
}

function withPurchaseQuery(baseUrl: string, options: { packSize: PackSize; universe: Universe }): string {
  const { packSize, universe } = options;
  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set("pack", String(packSize));
    parsed.searchParams.set("universe", universe);
    return parsed.toString();
  } catch {
    const join = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${join}pack=${packSize}&universe=${universe}`;
  }
}

function buildPurchaseUrls(baseUrl: string, universe: Universe): Record<PackSize, string> {
  return {
    5: withPurchaseQuery(baseUrl, { packSize: 5, universe }),
    15: withPurchaseQuery(baseUrl, { packSize: 15, universe }),
    30: withPurchaseQuery(baseUrl, { packSize: 30, universe }),
  };
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
  const [selectedPackSize, setSelectedPackSize] = useState<PackSize>(15);
  const [visiblePages, setVisiblePages] = useState(1);
  const [selectedDoflin, setSelectedDoflin] = useState<CollectionItemDTO | null>(null);
  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [brokenModalImageIds, setBrokenModalImageIds] = useState<number[]>([]);
  const [collection, setCollection] = useState<CollectionItemDTO[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(true);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialQuery);
  const [catalogAnimKey, setCatalogAnimKey] = useState(0);
  const [remaining, setRemaining] = useState<Record<Rarity, number> | null>(null);
  const [isAdminViewer, setIsAdminViewer] = useState(false);
  const [isAuthenticatedViewer, setIsAuthenticatedViewer] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [baseUnitPrice, setBaseUnitPrice] = useState<{ amount: string; currencyCode: string } | null>(null);

  useEffect(() => {
    fetch(`/api/shop/products?universe=${activeUniverse}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const price = (data as { products?: Array<{ price: { amount: string; currencyCode: string } }> }).products?.[0]?.price;
        if (price) setBaseUnitPrice(price);
      })
      .catch(() => null);
  }, [activeUniverse]);

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
    const normalizedSearch = debouncedSearchQuery.trim().toLowerCase();

    return featuredCollection
      .filter((item) => {
        if (rarityFilter !== "all" && toCatalogRarity(item.rarity) !== rarityFilter) {
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
  }, [featuredCollection, rarityFilter, debouncedSearchQuery]);

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
  const activeBaseModelStats = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        originals: number;
        variants: number;
      }
    >();

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
  const selectedPurchaseUniverseLabel = selectedPurchaseUniverse === "animals" ? "Animals" : "Multiverse";
  const selectedDoflinImageSrc =
    selectedDoflin && brokenModalImageIds.includes(selectedDoflin.id)
      ? FALLBACK_DOFLIN_IMAGE
      : selectedDoflin?.imageUrl ?? FALLBACK_DOFLIN_IMAGE;
  const remainingLegendaryCount = useMemo(() => {
    if (!remaining) {
      return null;
    }

    return (remaining.LEGENDARY ?? 0) + (remaining.ULTRA ?? 0) + (remaining.MYTHIC ?? 0);
  }, [remaining]);
  const selectedDoflinVariants = useMemo(() => {
    if (!selectedDoflin) {
      return [];
    }

    const key = baseModelKey(selectedDoflin);

    return activeUniverseCollection
      .filter((item) => baseModelKey(item) === key)
      .sort((a, b) => {
        const aOriginal = isOriginalVariant(a.variantName);
        const bOriginal = isOriginalVariant(b.variantName);

        if (aOriginal !== bOriginal) {
          return aOriginal ? -1 : 1;
        }

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
      sectionId: "universo-activo" | "rareza" | "catalogo" | "plataforma" | "guia",
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
      } finally {
        setIsLoadingCollection(false);
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

      if (typeof window !== "undefined") {
        window.localStorage.setItem(UNIVERSE_STORAGE_KEY, target);
      }

      setVisiblePages(1);
      setActiveUniverse(target);
      setCatalogAnimKey((k) => k + 1);

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
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(UNIVERSE_STORAGE_KEY) : null;
    const fromUrl = searchParams.get("universe");
    if (!fromUrl && saved) {
      const parsed = toUniverse(saved);
      if (parsed && parsed !== activeUniverse) {
        setActiveUniverse(parsed);
      }
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

  const tikTokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com";
  // URLs hacia la sección de compras (tienda headless en la página principal)
  const shopUrl = `/?universe=${activeUniverse}#compras`;
  const selectedShopUrl = `/?universe=${selectedPurchaseUniverse}#compras`;

  const handleShareDoflin = useCallback(async () => {
    if (!selectedDoflin) return;
    const url = `${window.location.origin}/reveal?universe=${activeUniverse}&q=${encodeURIComponent(selectedDoflin.name)}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${selectedDoflin.name} — DOFLINS`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado al portapapeles");
      }
    } catch {
      // user cancelled share — ignore
    }
  }, [activeUniverse, selectedDoflin]);

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
    <main className={`relative overflow-hidden pb-36 transition-colors duration-500 md:pb-24 ${activeUniverse === "animals" ? "ink-light" : "ink-light-blue"}`} style={themeVars}>
      {isOffline ? (
        <div className="sticky top-14 z-50 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
          <WifiIcon className="h-4 w-4" />
          Sin conexión — los datos pueden estar desactualizados
        </div>
      ) : null}
      <div className={`pointer-events-none absolute inset-0 -z-30 ${activeTheme.pageGlow}`} />
      <div className={`pointer-events-none absolute inset-0 -z-20 ${activeTheme.pageGradient}`} />

      <header className="sticky top-0 z-40 mx-auto w-full max-w-[84rem] px-4 pt-4 sm:px-6 lg:px-8 xl:px-10">
        <div className={`flex items-center gap-3 rounded-full border px-3 py-2 backdrop-blur ${activeTheme.headerShell}`}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              aria-label="Ir al inicio de DOFLINS"
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black text-white transition group-hover:scale-[1.02] ${activeTheme.logoGradient}`}
              >
                DF
              </div>
              <p className="font-title text-xl font-extrabold tracking-tight text-[var(--ink-900)] sm:text-2xl">DOFLINS</p>
            </Link>
          </div>

          <nav className="ml-2 hidden items-center gap-5 text-sm font-semibold text-[var(--ink-700)] lg:flex">
            <button type="button" onClick={() => scrollToSection("catalogo")} className="transition hover:text-[var(--brand-primary)]">
              Catálogo
            </button>
            <Link href="/#compras" className="transition hover:text-[var(--brand-primary)]">
              Tienda
            </Link>
            <button type="button" onClick={() => scrollToSection("plataforma")} className="transition hover:text-[var(--brand-primary)]">
              Colección
            </button>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              asChild
              className={`hidden h-11 px-5 text-white hover:brightness-105 sm:inline-flex sm:px-6 ${activeTheme.primaryButton}`}
            >
              <a
                href={shopUrl}
                onClick={() => handlePurchaseIntent({ source: "header_buy", packSize: 15 })}
              >
                Comprar {activeConfig.label}
              </a>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="h-10 w-10 rounded-full p-0 2xl:hidden">
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
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("catalogo")}>
                      <SparklesIcon className="h-4 w-4" /> Catálogo
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/#compras" className="w-full">
                      <Button variant="secondary" className="w-full justify-start">
                        <ShoppingCartIcon className="h-4 w-4" /> Tienda
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("plataforma")}>
                      <RectangleStackIcon className="h-4 w-4" /> Colección
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => switchUniverse("animals", "menu", "universo-activo")}>
                      <CubeIcon className="h-4 w-4" /> Animals
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => switchUniverse("multiverse", "menu", "universo-activo")}>
                      <BoltIcon className="h-4 w-4" /> Multiverse
                    </Button>
                  </SheetClose>
                  <div className="!mt-4 border-t border-black/10 pt-2">
                    {isAuthenticatedViewer ? (
                      <>
                        {viewerEmail ? (
                          <p className="mb-2 truncate px-3 text-xs text-[var(--ink-600)]">{viewerEmail}</p>
                        ) : null}
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => void handleUserLogout()}>
                            Cerrar sesión
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <SheetClose asChild>
                        <Button variant="secondary" className="w-full justify-start" onClick={() => void handleUserLogin()}>
                          Iniciar sesión
                        </Button>
                      </SheetClose>
                    )}
                    {isAdminViewer ? (
                      <SheetClose asChild>
                        <Link href="/admin/doflins">
                          <Button variant="ghost" className="w-full justify-start">
                            <ShieldCheckIcon className="h-4 w-4" /> Admin
                          </Button>
                        </Link>
                      </SheetClose>
                    ) : null}
                  </div>
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
              <Button size="lg" className={`h-12 ${activeTheme.primaryButton}`} onClick={() => scrollToSection("catalogo")}>
                <SparklesIcon className="h-5 w-5" /> Ver catálogo
              </Button>
              <Button variant="secondary" size="lg" className="h-12" onClick={() => scrollToSection("guia")}>
                <InformationCircleIcon className="h-5 w-5" /> Cómo coleccionar
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-12 touch-manipulation">
                <a
                  href={shopUrl}
                  onClick={() => handlePurchaseIntent({ source: "hero_buy", packSize: 15 })}
                >
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar {activeConfig.label}
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

        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Universo activo">
          <Button
            role="tab"
            aria-selected={activeUniverse === "animals"}
            size="sm"
            className={activeUniverse === "animals" ? activeTheme.primaryButton : undefined}
            variant={activeUniverse === "animals" ? "primary" : "secondary"}
            onClick={() => switchUniverse("animals", "active_universe_toggle")}
          >
            Ver Animals
          </Button>
          <Button
            role="tab"
            aria-selected={activeUniverse === "multiverse"}
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


      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="catalogo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Catálogo de {activeConfig.label}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={activeConfig.badgeClass}>{activeCatalogCards.length} animales base visibles</Badge>
            <Badge className={activeConfig.badgeClass}>
              {activeBaseModelStats.baseCount} base · {activeBaseModelStats.variantCount} variantes
            </Badge>
            <Badge className={activeConfig.badgeClass}>
              Colección total {ownedTotalCount}/{featuredCollection.length} · {ownedTotalPercent}%
            </Badge>
          </div>
        </div>

        <Card className={`mb-4 ${activeTheme.panelCard}`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-[var(--ink-700)]">
              Estás explorando <span className="font-semibold text-[var(--ink-900)]">{activeConfig.label}</span>. Comprar desde aquí abre packs del
              mismo universo.
            </p>
            <Button asChild size="sm" className={activeTheme.primaryButton}>
              <a
                href={shopUrl}
                onClick={() => handlePurchaseIntent({ source: "catalog_universe_buy", packSize: 15 })}
              >
                <ShoppingCartIcon className="h-4 w-4" /> Comprar {activeConfig.label} x15
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className={`sticky top-0 z-20 backdrop-blur-sm ${activeTheme.panelCard}`}>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Universo">
              <Button
                role="tab"
                aria-selected={activeUniverse === "animals"}
                size="sm"
                className={activeUniverse === "animals" ? activeTheme.primaryButton : undefined}
                variant={activeUniverse === "animals" ? "primary" : "secondary"}
                onClick={() => switchUniverse("animals", "catalog_toggle")}
              >
                Mostrar Animals
              </Button>
              <Button
                role="tab"
                aria-selected={activeUniverse === "multiverse"}
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
                  className="pl-10 pr-8"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => { setSearchQuery(""); setDebouncedSearchQuery(""); setVisiblePages(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--ink-600)] transition hover:text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
                <FunnelIcon className="h-4 w-4" /> Rareza
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Filtro de rareza"
              className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
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
                    className={`shrink-0 ${isActive ? activeTheme.primaryButton : ""}`}
                    onClick={() => applyRarityFilter(option.value, "catalog_rarity")}
                  >
                    {option.label}
                    {count > 0 ? (
                      <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                        {count}
                      </span>
                    ) : null}
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
          key={catalogAnimKey}
          className="mt-5 grid animate-catalog-fadein gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]"
        >
          {isLoadingCollection
            ? Array.from({ length: 8 }, (_, skI) => (
                <div
                  key={`skel-${skI}`}
                  className={`space-y-3 overflow-hidden rounded-[2rem] border p-3.5 ${activeConfig.cardClass}`}
                >
                  <div className="h-[132px] animate-pulse rounded-xl bg-black/[0.07] sm:h-[145px]" />
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
              <Card
                key={item.id}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 280px' }}
                className={`overflow-hidden rounded-[2rem] border ${activeConfig.cardClass} ${isOwned ? "ring-2 ring-[var(--brand-primary)]/40 shadow-[0_12px_26px_rgba(29,50,103,0.2)]" : ""}`}
              >
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
                    <Figure3D
                      src={item.imageUrl}
                      fallbackSrc={FALLBACK_DOFLIN_IMAGE}
                      alt={item.name}
                      rarity={item.rarity}
                      imageClassName="h-[132px] w-[132px] sm:h-[145px] sm:w-[145px] mx-auto"
                      className="rounded-[1.25rem] p-2.5"
                      modelUrl={modelConfig?.modelUrl}
                      modelOrientation={modelConfig?.orientation}
                      modelCameraOrbit={modelConfig?.cameraOrbit}
                      modelFieldOfView={modelConfig?.fieldOfView}
                      lazyModel={index >= 4}
                    />
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
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10" id="rareza">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Sistema de rareza</h3>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--ink-700)] ${activeTheme.rarityInfoChip}`}>
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
        <div className="grid gap-4 md:grid-cols-3">
          {BUY_PACK_OPTIONS.map((pack) => {
            const isRecommended = pack.packSize === 15;
            return (
              <div
                key={pack.packSize}
                className={`relative flex flex-col overflow-hidden rounded-3xl border transition hover:-translate-y-1 ${
                  isRecommended
                    ? "border-[var(--brand-primary)] shadow-[0_8px_28px_rgba(78,111,42,0.22)]"
                    : "border-[#d7cfb0] shadow-sm"
                } ${activeTheme.panelCard}`}
              >
                {isRecommended ? (
                  <div className={`py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white ${activeTheme.primaryButton}`}>
                    Más popular
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  {/* big pack number as visual anchor */}
                  <div className="mb-3 flex items-end gap-1.5">
                    <span className="font-title text-[4.5rem] leading-none text-[var(--ink-900)]">{pack.packSize}</span>
                    <span className="mb-2 text-sm font-semibold text-[var(--ink-600)]">figuras</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-600)]">{pack.subtitle}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ink-700)]">{pack.benefit}</p>

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
                          style={{
                            background: cfg.softColor,
                            color: cfg.color,
                            outline: `1px solid ${cfg.color}40`,
                          }}
                          title={`~${expected} figura${expected === 1 ? "" : "s"} ${cfg.label}`}
                        >
                          ~{expected} {cfg.label}
                        </span>
                      );
                    })}
                  </div>

                  {baseUnitPrice ? (
                    <p className="mt-3 font-title text-2xl leading-none text-[var(--ink-900)]">
                      {formatPackPrice(baseUnitPrice, pack.packSize)}
                      <span className="ml-1.5 text-sm font-semibold text-[var(--ink-600)]">{baseUnitPrice.currencyCode}</span>
                    </p>
                  ) : null}
                  <Button
                    asChild
                    variant={isRecommended ? undefined : "ghost"}
                    className={`mt-5 w-full ${isRecommended ? activeTheme.primaryButton : "bg-[var(--ink-900)] !text-white hover:brightness-125"}`}
                  >
                    <a
                      href={shopUrl}
                      onClick={() =>
                        handlePurchaseIntent({
                          source: `packs_section_${pack.packSize}`,
                          packSize: pack.packSize,
                        })
                      }
                    >
                      <ShoppingCartIcon className="h-4 w-4" /> Comprar {pack.packSize} figuras
                    </a>
                  </Button>
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
              <Button asChild variant="ghost" className={`bg-white hover:bg-slate-100 ${activeTheme.ctaPrimaryText}`} size="lg">
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
            <>
              {/* Prev / Next navigation */}
              {activeCatalogCards.length > 1 ? (
                <div className="absolute left-0 right-0 top-1/2 z-50 flex -translate-y-1/2 items-center justify-between px-2 md:px-3 pointer-events-none">
                  <button
                    type="button"
                    aria-label="Doflin anterior"
                    disabled={selectedDoflinIndexInCatalog <= 0}
                    onClick={() => {
                      const prev = activeCatalogCards[selectedDoflinIndexInCatalog - 1];
                      if (prev) setSelectedDoflin(prev);
                    }}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/10 transition hover:bg-white disabled:opacity-30"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-[var(--ink-900)]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Doflin siguiente"
                    disabled={selectedDoflinIndexInCatalog >= activeCatalogCards.length - 1}
                    onClick={() => {
                      const next = activeCatalogCards[selectedDoflinIndexInCatalog + 1];
                      if (next) setSelectedDoflin(next);
                    }}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/10 transition hover:bg-white disabled:opacity-30"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-[var(--ink-900)]" />
                  </button>
                </div>
              ) : null}
            <div className={`grid gap-0 ${selectedDoflinHas3DModel ? "md:grid-cols-[1.1fr_0.9fr]" : "md:grid-cols-[1fr_1fr]"}`}>
              <div
                className={`relative min-h-[320px] p-4 sm:p-5 ${
                  selectedDoflinHas3DModel
                    ? "bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,241,255,0.92))]"
                    : "bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(243,246,230,0.95))]"
                }`}
              >
                {selectedDoflinHas3DModel ? (
                  <model-viewer
                    src={selectedDoflinModelConfig?.modelUrl ?? ""}
                    alt={selectedDoflin.name}
                    poster={selectedDoflin.imageUrl}
                    orientation={selectedDoflinModelConfig?.orientation}
                    camera-orbit={selectedDoflinModelConfig?.cameraOrbit ?? "0deg 60deg auto"}
                    field-of-view={selectedDoflinModelConfig?.fieldOfView ?? "28deg"}
                    shadow-intensity="0.7"
                    exposure="1.2"
                    camera-controls
                    auto-rotate
                    interaction-prompt="none"
                    className="h-[360px] w-full"
                    style={{ background: "transparent", display: "block" }}
                  />
                ) : (
                  <div>
                    <div className="relative flex h-[332px] w-full items-center justify-center overflow-hidden rounded-3xl border border-[#dcd2af] bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.98),rgba(247,242,221,0.92)_58%,rgba(236,228,197,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_14px_30px_rgba(89,90,52,0.2)]">
                      <div className="pointer-events-none absolute inset-x-10 bottom-6 h-6 rounded-full bg-black/14 blur-md" />
                      <div className="relative z-10 h-full max-h-[286px] w-[286px] overflow-hidden rounded-2xl drop-shadow-[0_18px_30px_rgba(42,45,21,0.22)]">
                        <Image
                          src={selectedDoflinImageSrc}
                          alt={selectedDoflin.name}
                          width={780}
                          height={780}
                          className="h-full w-full object-cover"
                          onError={() => {
                            setBrokenModalImageIds((previous) => {
                              if (previous.includes(selectedDoflin.id)) {
                                return previous;
                              }

                              return [...previous, selectedDoflin.id];
                            });
                          }}
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto p-5 sm:p-6 max-h-[65vh] md:max-h-none">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                    <span>{selectedDoflin.name}</span>
                    <button
                      type="button"
                      aria-label="Compartir Doflin"
                      onClick={() => void handleShareDoflin()}
                      className="shrink-0 rounded-full p-1.5 text-[var(--ink-600)] transition hover:bg-black/[0.06] hover:text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                  </DialogTitle>
                  <DialogDescription>
                    {selectedDoflin.baseModel} · {variantLabel(selectedDoflin.variantName)} · Serie {selectedDoflin.series} · #
                    {String(selectedDoflin.collectionNumber).padStart(2, "0")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      selectedDoflinIsOriginal
                        ? "bg-[#eaf5d8] text-[#2f5b1f] ring-1 ring-[#c6dba0]"
                        : "bg-[#e9efff] text-[#2f448f] ring-1 ring-[#c9d6ff]"
                    }
                  >
                    {selectedDoflinIsOriginal ? "Animal original" : "Variante"}
                  </Badge>
                  <Badge className="bg-white text-[var(--ink-700)] ring-1 ring-black/10">{variantLabel(selectedDoflin.variantName)}</Badge>
                  {selectedDoflinGroupStats && selectedDoflinGroupStats.total > 1 ? (
                    <Badge className="bg-white text-[var(--ink-700)] ring-1 ring-black/10">
                      {selectedDoflinGroupStats.total} versiones de {selectedDoflin.baseModel}
                    </Badge>
                  ) : null}
                  <RarityPill rarity={selectedDoflin.rarity} />
                  {selectedDoflinRarityConfig ? (
                    <Badge className={activeConfig.badgeClass}>
                      {selectedDoflinRarityConfig.probability}% {selectedDoflinRarityConfig.label.toLowerCase()}
                    </Badge>
                  ) : null}
                </div>
                {selectedDoflin.funFact ? (
                  <div className={`rounded-2xl p-3.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.07)] ${activeTheme.panelCard}`}>
                    <div className="flex items-center gap-1.5">
                      <SparklesIcon className="h-3.5 w-3.5 shrink-0 text-[var(--brand-accent)]" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-600)]">Dato curioso</p>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-800)]">{selectedDoflin.funFact}</p>
                  </div>
                ) : null}
                {selectedDoflinVariants.length > 1 ? (
                  <div className={`rounded-2xl p-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] ${activeTheme.panelCard}`}>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">
                      Variantes de {selectedDoflin.baseModel}
                    </p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {selectedDoflinVariants.map((variant) => {
                        const isCurrent = variant.id === selectedDoflin.id;
                        const variantCatalogRarity = toCatalogRarity(variant.rarity);
                        const variantRarityConfig = CATALOG_RARITY_CONFIG[variantCatalogRarity];

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedDoflin(variant)}
                            className={`group flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center transition ${
                              isCurrent
                                ? "bg-[#edf7df] shadow-[inset_0_0_0_1.5px_#b9d598]"
                                : "bg-white/60 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-white hover:shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.14)]"
                            }`}
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                              <Image
                                src={variant.imageUrl || FALLBACK_DOFLIN_IMAGE}
                                alt={variant.name}
                                fill
                                className="object-cover transition duration-200 group-hover:scale-[1.04]"
                                unoptimized
                              />
                            </div>
                            <p className="w-full truncate text-[11px] font-semibold leading-tight text-[var(--ink-900)]">
                              {variantLabel(variant.variantName)}
                            </p>
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                              style={{
                                backgroundColor: variantRarityConfig.softColor,
                                color: variantRarityConfig.color,
                              }}
                            >
                              {variantRarityConfig.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className={`rounded-2xl p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] ${activeTheme.panelCard}`}>
                  <div className="flex items-center gap-1.5">
                    <CheckCircleIcon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isAuthenticatedViewer && selectedDoflinIsOwned
                          ? "text-[var(--brand-primary)]"
                          : "text-[var(--ink-400)]"
                      }`}
                    />
                    <p className="text-xs font-semibold text-[var(--ink-700)]">Tu colección</p>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--ink-900)]">
                    {isAuthenticatedViewer
                      ? selectedDoflinIsOwned
                        ? "Ya la tienes guardada"
                        : "Todavía no la tienes marcada"
                      : "Guarda tu progreso con una cuenta gratuita"}
                  </p>
                  <Button
                    size="sm"
                    className={`mt-3 w-full ${
                      isAuthenticatedViewer && !selectedDoflinIsOwned ? activeTheme.primaryButton : ""
                    }`}
                    variant={
                      !isAuthenticatedViewer
                        ? "secondary"
                        : selectedDoflinIsOwned
                          ? "secondary"
                          : "primary"
                    }
                    onClick={() => {
                      if (!isAuthenticatedViewer) {
                        requestAuthForProgress();
                        return;
                      }
                      if (selectedDoflinIsOwned) {
                        clearOwnedMark(selectedDoflin.id);
                      } else {
                        markAsOwned(selectedDoflin.id);
                      }
                    }}
                  >
                    {!isAuthenticatedViewer
                      ? "Crear cuenta gratis"
                      : selectedDoflinIsOwned
                        ? "Quitar de mi colección"
                        : "Marcar como conseguida"}
                  </Button>
                </div>
                <div className="space-y-2.5 border-t border-black/[0.06] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)]">Comprar sobres</p>
                  <Button asChild className={`w-full ${activeTheme.primaryButton}`}>
                    <a
                      href={selectedShopUrl}
                      onClick={() =>
                        handlePurchaseIntent({
                          source: "modal_buy",
                          packSize: 15,
                          doflinId: selectedDoflin.id,
                        })
                      }
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>Sobre x15</span>
                        <span className="text-xs font-medium opacity-80">Más chances de conseguirla</span>
                      </span>
                    </a>
                  </Button>
                  <Button asChild variant="secondary" className="w-full">
                    <a
                      href={selectedShopUrl}
                      onClick={() =>
                        handlePurchaseIntent({
                          source: "modal_buy",
                          packSize: 5,
                          doflinId: selectedDoflin.id,
                        })
                      }
                    >
                      <span className="flex flex-col items-start leading-tight">
                        <span>Sobre x5</span>
                        <span className="text-xs font-medium opacity-70">Para probar suerte</span>
                      </span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            </>
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
          <Button asChild className={`h-11 w-full ${activeTheme.primaryButton}`}>
            <a
              href={shopUrl}
              onClick={() =>
                handlePurchaseIntent({
                  source: "sticky_mobile_buy",
                  packSize: selectedPackSize,
                })
              }
            >
              <ShoppingCartIcon className="h-5 w-5" /> Comprar {activeConfig.label} x{selectedPackSize}
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
