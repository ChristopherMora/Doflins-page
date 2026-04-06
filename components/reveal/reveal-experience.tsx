"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BoltIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  FireIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  LinkIcon,
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
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
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
import { LazySection } from "@/components/ui/lazy-section";

const FALLBACK_DOFLIN_IMAGE = "/images/placeholders/doflin-placeholder.svg";
const ACTIVE_SERIES = ["Animals", "Multiverse", "MegaAnimals"] as const;
const UNIVERSE_STORAGE_KEY = "doflins_last_universe_v1";

type Universe = "animals" | "multiverse" | "mega";
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

const MEGA_PACKS: PackOption[] = [
  {
    name: "Cachorros",
    pieces: 5,
    detail: "Primer encuentro con los Mega Animals",
    icon: MapIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#fdf0e0,#f9dfc0,#f3ca90)] shadow-[0_18px_34px_rgba(170,100,30,0.22)]",
  },
  {
    name: "Manada",
    pieces: 15,
    detail: "Balance ideal para coleccionar Megas",
    icon: GlobeAltIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#fde8d0,#f8d0a8,#f0b870)] shadow-[0_18px_34px_rgba(180,90,20,0.22)]",
  },
  {
    name: "Alfa",
    pieces: 30,
    detail: "La experiencia completa Mega Animals",
    icon: FireIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#fdddc8,#f8c898,#f0a858)] shadow-[0_18px_34px_rgba(190,80,20,0.24)]",
  },
];

const RARITY_GLOW_CSS: Partial<Record<string, string>> = {
  LEGENDARY: "0 0 18px rgba(213,154,26,0.55), 0 0 38px rgba(213,154,26,0.22)",
  ULTRA:     "0 0 18px rgba(179,58,44,0.55),  0 0 38px rgba(179,58,44,0.20)",
  MYTHIC:    "0 0 22px rgba(212,175,55,0.65), 0 0 52px rgba(212,175,55,0.28)",
  EPIC:      "0 0 12px rgba(180,106,45,0.40)",
  RARE:      "0 0 10px rgba(46,122,78,0.30)",
};

const PARTICLE_COLOR: Partial<Record<string, string>> = {
  LEGENDARY: "rgba(213,154,26,0.75)",
  ULTRA:     "rgba(220,80,60,0.75)",
  MYTHIC:    "rgba(212,175,55,0.85)",
};

const RARITY_FILTER_OPTIONS: { value: RarityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...CATALOG_RARITY_ORDER.map((rarity) => ({
    value: rarity,
    label: CATALOG_RARITY_CONFIG[rarity].label,
  })),
];

const UNIVERSE_THEME_LIGHT: Record<Universe, UniverseTheme> = {
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
  mega: {
    pageGlow:
      "bg-[radial-gradient(circle_at_8%_10%,rgba(210,130,40,0.26),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(220,160,60,0.22),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(185,100,30,0.2),transparent_34%)]",
    pageGradient: "bg-[linear-gradient(180deg,#fdf4e3,#f5e8cb_42%,#eddbb0)]",
    headerShell: "border-[#e8cc90]/85 bg-[#fff8e8]/90 shadow-[0_10px_26px_rgba(120,80,20,0.2)]",
    logoGradient: "bg-[linear-gradient(135deg,#8b5e1a,#c4883a)]",
    primaryButton: "bg-[linear-gradient(135deg,#a06820,#c4883a)]",
    pillButton: "bg-[linear-gradient(135deg,#a06820,#c4883a)] text-white",
    heroBadge: "border-[#e8cc90] bg-[#fff8e4] text-[#7a4e14] ring-1 ring-[#d6b870]",
    heroChip: "border-[#e8d090] bg-[#fff8e4]",
    heroStateCard: "border-[#e8cc90]/80 bg-[#fff8e4]/90 shadow-[0_18px_45px_rgba(120,80,20,0.18)]",
    heroStateInfo: "bg-white/90",
    panelCard: "border-[#e8cc90] bg-[#fff8e4]/90",
    rarityInfoChip: "bg-[#fff4d8] ring-1 ring-[#d8b870]",
    rarityCard: "border-[#e8cc90] bg-[#fff8e4]/88",
    platformCard: "border-[#e0b870] bg-[#fff8e4]/90",
    ctaCard: "bg-[linear-gradient(135deg,#6b3f0e,#a06828,#c47820)] shadow-[0_25px_50px_rgba(100,60,10,0.5)]",
    ctaPrimaryText: "text-[#5a3410]",
    heroTitle: "Catálogo Mega Animals",
    heroDescription:
      "Las versiones grandes y poderosas de los Animals. Figuras imponentes con presencia XL para los coleccionistas más ambiciosos.",
    heroTag: "Universo Mega Animals",
    qrNarrative: "Escanea para ver los Mega Animals disponibles y tu progreso de colección.",
  },
};

const UNIVERSE_THEME_DARK: Record<Universe, UniverseTheme> = {
  animals: {
    pageGlow:
      "bg-[radial-gradient(circle_at_8%_10%,rgba(127,182,72,0.25),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(103,149,54,0.24),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(176,132,50,0.17),transparent_34%)]",
    pageGradient: "bg-[linear-gradient(180deg,#0f1a0a,#141f0f_42%,#182513)]",
    headerShell: "border-[#44612f]/85 bg-[#111e0d]/90 shadow-[0_10px_26px_rgba(2,9,2,0.45)]",
    logoGradient: "bg-[linear-gradient(135deg,#5d9138,#84b95a)]",
    primaryButton: "bg-[linear-gradient(135deg,#5d9138,#84b95a)]",
    pillButton: "bg-[linear-gradient(135deg,#5d9138,#84b95a)] text-white",
    heroBadge: "ink-light border-[#e4d6af] bg-[#fff9ea] text-[#445538] ring-1 ring-[#d6c79b]",
    heroChip: "ink-light border-[#e6d9b4] bg-[#fff8e8] text-[#445538]",
    heroStateCard: "ink-light border-[#e8dcb8]/80 bg-[#fff9ea]/90 shadow-[0_18px_45px_rgba(89,79,30,0.18)]",
    heroStateInfo: "bg-white/90",
    panelCard: "ink-light border-[#e7dab8] bg-[#fff9ea]/90",
    rarityInfoChip: "ink-light bg-[#fff7df] text-[#445538] ring-1 ring-[#d3c18f]",
    rarityCard: "ink-light border-[#e8dab4] bg-[#fff9e8]/88",
    platformCard: "ink-light border-[#dccc99] bg-[#fff8e7]/90",
    ctaCard: "bg-[linear-gradient(135deg,#1e3312,#274d39,#324c8d)] shadow-[0_25px_50px_rgba(3,8,5,0.6)]",
    ctaPrimaryText: "text-[#1f3b12]",
    heroTitle: "Catálogo Animals",
    heroDescription:
      "Tonos naturales, energía de selva y personajes inspirados en fauna. Aquí el universo se siente orgánico y coleccionable.",
    heroTag: "Universo Animals",
    qrNarrative: "Este QR te abre el catálogo oficial y tu progreso de colección.",
  },
  multiverse: {
    pageGlow:
      "bg-[radial-gradient(circle_at_10%_8%,rgba(115,149,255,0.3),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(132,103,246,0.28),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(70,110,225,0.24),transparent_30%)]",
    pageGradient: "bg-[linear-gradient(180deg,#070d24,#0c1538_42%,#111b46)]",
    headerShell: "border-[#3e529f]/85 bg-[#0e173a]/90 shadow-[0_10px_26px_rgba(2,5,22,0.5)]",
    logoGradient: "bg-[linear-gradient(135deg,#5068d4,#7090f8)]",
    primaryButton: "bg-[linear-gradient(135deg,#5068d4,#7090f8)]",
    pillButton: "bg-[linear-gradient(135deg,#5068d4,#7090f8)] text-white",
    heroBadge: "ink-light-blue border-[#cad4ff] bg-[#eef2ff] text-[#2d3f8a] ring-1 ring-[#c4d0ff]",
    heroChip: "ink-light-blue border-[#d1dbff] bg-[#f3f6ff] text-[#2d3f8a]",
    heroStateCard: "ink-light-blue border-[#d3ddff]/90 bg-[#f4f7ff]/92 shadow-[0_18px_45px_rgba(73,88,153,0.2)]",
    heroStateInfo: "bg-white/88",
    panelCard: "ink-light-blue border-[#d7e0ff] bg-[#f6f8ff]/92",
    rarityInfoChip: "ink-light-blue bg-[#eef3ff] text-[#2d3f8a] ring-1 ring-[#c8d4ff]",
    rarityCard: "ink-light-blue border-[#d2dcff] bg-[#f5f8ff]/92",
    platformCard: "ink-light-blue border-[#cdd8ff] bg-[#f5f7ff]/94",
    ctaCard: "bg-[linear-gradient(135deg,#1b2d7a,#3448a5,#6548b8)] shadow-[0_25px_50px_rgba(8,12,38,0.62)]",
    ctaPrimaryText: "text-[#243271]",
    heroTitle: "Catálogo Multiverse",
    heroDescription:
      "Paleta fría, vibe futurista y variantes de alto impacto. Es un universo más agresivo para cazadores de rareza.",
    heroTag: "Universo Multiverse",
    qrNarrative: "Desde aquí puedes cambiar de universo y guardar tu avance.",
  },
  mega: {
    pageGlow:
      "bg-[radial-gradient(circle_at_8%_10%,rgba(200,120,30,0.28),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(220,150,40,0.25),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(190,100,20,0.2),transparent_34%)]",
    pageGradient: "bg-[linear-gradient(180deg,#1c0e00,#271500_42%,#301a00)]",
    headerShell: "border-[#7a4f1a]/85 bg-[#1c1000]/90 shadow-[0_10px_26px_rgba(8,4,0,0.5)]",
    logoGradient: "bg-[linear-gradient(135deg,#c08030,#e0a050)]",
    primaryButton: "bg-[linear-gradient(135deg,#b07028,#d89040)]",
    pillButton: "bg-[linear-gradient(135deg,#b07028,#d89040)] text-white",
    heroBadge: "ink-light border-[#e8cc90] bg-[#fff8e4] text-[#7a4e14] ring-1 ring-[#d6b870]",
    heroChip: "ink-light border-[#e8d090] bg-[#fff8e4] text-[#7a4e14]",
    heroStateCard: "ink-light border-[#e8cc90]/80 bg-[#fff8e4]/90 shadow-[0_18px_45px_rgba(120,80,20,0.18)]",
    heroStateInfo: "bg-white/90",
    panelCard: "ink-light border-[#e8cc90] bg-[#fff8e4]/90",
    rarityInfoChip: "ink-light bg-[#fff4d8] text-[#7a4e14] ring-1 ring-[#d8b870]",
    rarityCard: "ink-light border-[#e8cc90] bg-[#fff8e4]/88",
    platformCard: "ink-light border-[#e0b870] bg-[#fff8e4]/90",
    ctaCard: "bg-[linear-gradient(135deg,#4a2808,#7a4818,#b06828)] shadow-[0_25px_50px_rgba(30,12,0,0.65)]",
    ctaPrimaryText: "text-[#5a3410]",
    heroTitle: "Catálogo Mega Animals",
    heroDescription:
      "Las versiones grandes y poderosas de los Animals. Figuras imponentes con presencia XL para los coleccionistas más ambiciosos.",
    heroTag: "Universo Mega Animals",
    qrNarrative: "Escanea para ver los Mega Animals disponibles y tu progreso de colección.",
  },
};

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
function RarityParticles({ rarity }: { rarity: string }): React.JSX.Element {
  const color = PARTICLE_COLOR[rarity] ?? "rgba(213,154,26,0.75)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className="particle-float absolute rounded-full"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            backgroundColor: color,
            left: `${10 + i * 15}%`,
            bottom: "8%",
            animationDuration: `${2.4 + i * 0.35}s`,
            animationDelay: `${i * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}

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

  return value === "animals" || value === "multiverse" || value === "mega" ? value : null;
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
  const n = normalizeSeries(series);
  if (n === "multiverse") return "multiverse";
  if (n === "megaanimals") return "mega";
  return "animals";
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.dataset.theme === "dark");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Subcomponentes extraídos ──────────────────────────────────────────────

interface DoflinModalProps {
  selectedDoflin: CollectionItemDTO | null;
  onClose: () => void;
  catalog: CollectionItemDTO[];
  catalogIndex: number;
  onNavigate: (item: CollectionItemDTO) => void;
  has3DModel: boolean;
  modelConfig: DoflinModelConfig | undefined;
  purchaseUniverse: Universe;
  rarityConfig: { color: string; softColor: string; label: string; probability: number } | null;
  isOriginal: boolean;
  isOwned: boolean;
  groupStats: { total: number; originals: number; variants: number } | undefined;
  variants: CollectionItemDTO[];
  imageSrc: string;
  shopUrl: string;
  isAuthenticated: boolean;
  isDark: boolean;
  theme: UniverseTheme;
  onShare: () => void;
  onMarkOwned: (id: number) => void;
  onClearOwned: (id: number) => void;
  onPurchaseIntent: (opts?: { source?: string; packSize?: PackSize; doflinId?: number }) => void;
  onRequestAuth: () => void;
  brokenImageIds: number[]; // eslint-disable-line @typescript-eslint/no-unused-vars
  onImageBroken: React.Dispatch<React.SetStateAction<number[]>>;
  brokenVariantImageIds: Set<number>;
  onVariantImageBroken: React.Dispatch<React.SetStateAction<Set<number>>>;
}

function DoflinModal({
  selectedDoflin,
  onClose,
  catalog,
  catalogIndex,
  onNavigate,
  has3DModel,
  modelConfig,
  purchaseUniverse,
  rarityConfig,
  isOriginal,
  isOwned,
  groupStats,
  variants,
  imageSrc,
  shopUrl,
  isAuthenticated,
  isDark,
  theme,
  onShare,
  onMarkOwned,
  onClearOwned,
  onPurchaseIntent,
  onRequestAuth,
  brokenImageIds,
  onImageBroken,
  brokenVariantImageIds,
  onVariantImageBroken,
}: DoflinModalProps): React.JSX.Element {
  const [showShareSheet, setShowShareSheet] = useState(false);

  const shareUrl = selectedDoflin
    ? typeof window !== "undefined"
      ? `${window.location.origin}/carta/${selectedDoflin.id}`
      : `/carta/${selectedDoflin.id}`
    : "";
  const shareText = selectedDoflin
    ? `¡Acabo de sacar una figura ${rarityConfig?.label ?? selectedDoflin.rarity} 🔥 ${selectedDoflin.name} en @doflins! 🎴 #doflins #coleccionables`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      // ignore
    }
    setShowShareSheet(false);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
    setShowShareSheet(false);
  };

  const handleShareTikTok = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Texto copiado — pégalo en tu video de TikTok 🎵");
    } catch {
      // ignore
    }
    window.open("https://www.tiktok.com", "_blank", "noopener,noreferrer");
    setShowShareSheet(false);
  };

  const handleShareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Texto copiado — pégalo en tu historia de Instagram 📸");
    } catch {
      // ignore
    }
    setShowShareSheet(false);
  };

  return (
    <Dialog
      open={Boolean(selectedDoflin)}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="w-[min(96vw,960px)] max-h-[92svh] gap-0 overflow-y-auto p-0 md:overflow-hidden">
        {selectedDoflin ? (
          <>
            <div className="flex flex-col">
              <div className={`grid gap-0 ${has3DModel ? "md:grid-cols-[1.1fr_0.9fr]" : "md:grid-cols-[1fr_1fr]"}`}>
                {/* LEFT — image panel */}
                <div className={`relative flex min-h-[260px] items-center justify-center overflow-hidden md:min-h-[400px] ${
                  purchaseUniverse === "multiverse"
                    ? "bg-[linear-gradient(145deg,#111028,#1e1c48,#262450)]"
                    : purchaseUniverse === "mega"
                    ? "bg-[linear-gradient(145deg,#1a1208,#2a1e08,#3a2c10)]"
                    : "bg-[linear-gradient(145deg,#101410,#182018,#1e2a1e)]"
                }>`}>
                  {catalog.length > 1 ? (
                    <>
                      <button type="button" aria-label="Doflin anterior"
                        disabled={catalogIndex <= 0}
                        onClick={() => { const prev = catalog[catalogIndex - 1]; if (prev) onNavigate(prev); }}
                        className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/20 transition hover:bg-white/30 disabled:opacity-20 active:scale-95">
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Doflin siguiente"
                        disabled={catalogIndex >= catalog.length - 1}
                        onClick={() => { const next = catalog[catalogIndex + 1]; if (next) onNavigate(next); }}
                        className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/20 transition hover:bg-white/30 disabled:opacity-20 active:scale-95">
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                  <div className={`pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-25 ${
                    purchaseUniverse === "multiverse" ? "bg-indigo-400" : purchaseUniverse === "mega" ? "bg-amber-500" : "bg-emerald-600"
                  }`} />
                  <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md ring-1 ring-white/20">
                    {purchaseUniverse === "multiverse" ? "⚡ Multiverse" : purchaseUniverse === "mega" ? "🦣 Mega Animals" : "🌿 Animals"}
                  </span>
                  {has3DModel ? (
                    <model-viewer
                      src={modelConfig?.modelUrl ?? ""}
                      alt={selectedDoflin.name}
                      poster={selectedDoflin.imageUrl}
                      orientation={modelConfig?.orientation}
                      camera-orbit={modelConfig?.cameraOrbit ?? "0deg 60deg auto"}
                      field-of-view={modelConfig?.fieldOfView ?? "28deg"}
                      shadow-intensity="0.7" exposure="1.2"
                      camera-controls auto-rotate interaction-prompt="none"
                      className="relative z-10 h-[260px] w-full md:h-[400px]"
                      style={{ background: "transparent", display: "block" }}
                    />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center gap-3 p-5 md:gap-4 md:p-8">
                      <div className="relative flex h-[200px] w-[160px] items-center justify-center overflow-hidden rounded-[1.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_24px_48px_rgba(0,0,0,0.45)] md:h-[260px] md:w-[205px] md:rounded-[2rem]">
                        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] md:rounded-[2rem]" />
                        <div className="pointer-events-none absolute inset-x-10 bottom-3 h-5 rounded-full bg-black/40 blur-xl" />
                        <Image
                          src={imageSrc}
                          alt={selectedDoflin.name}
                          width={780} height={780}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="h-full w-full object-cover"
                          onError={() => {
                            onImageBroken((prev) => {
                              if (prev.includes(selectedDoflin.id)) return prev;
                              return [...prev, selectedDoflin.id];
                            });
                          }}
                        />
                      </div>
                      {rarityConfig ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur-sm"
                          style={{ backgroundColor: rarityConfig.softColor, color: rarityConfig.color }}
                        >
                          {rarityConfig.probability}% · {rarityConfig.label}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* RIGHT — info panel */}
                <div className="flex flex-col bg-[var(--surface-50)] md:max-h-[92svh] md:overflow-hidden">
                  <div className="flex flex-1 flex-col gap-4 p-5 md:overflow-y-auto md:p-6">
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <div>
                        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)]">
                          Serie {selectedDoflin.series} · #{String(selectedDoflin.collectionNumber).padStart(2, "0")}
                        </p>
                        <h2 className="font-title text-2xl font-bold leading-tight text-[var(--ink-900)]">
                          {selectedDoflin.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-[var(--ink-500)]">{selectedDoflin.baseModel}</p>
                      </div>
                      <div className="relative flex shrink-0 items-center gap-1">
                        <button type="button" aria-label="Compartir"
                          onClick={() => { setShowShareSheet((v) => !v); }}
                          className="rounded-full p-2 text-[var(--ink-400)] transition hover:bg-black/[0.06] hover:text-[var(--ink-800)]">
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        {showShareSheet ? (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => { setShowShareSheet(false); }} />
                            <div className="absolute right-0 top-full z-20 mt-1 flex min-w-[190px] flex-col overflow-hidden rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] shadow-xl">
                              <button type="button" onClick={() => { void handleShareTikTok(); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.02-.08z"/>
                                </svg>
                                TikTok
                              </button>
                              <button type="button" onClick={() => { void handleShareInstagram(); }}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                Instagram
                              </button>
                              <button type="button" onClick={handleShareWhatsApp}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                              </button>
                              <button type="button" onClick={() => { void handleCopyLink(); }}
                                className="flex items-center gap-3 border-t border-[var(--surface-200)] px-4 py-3 text-sm text-[var(--ink-700)] transition hover:bg-black/[0.04]">
                                <LinkIcon className="h-4 w-4 shrink-0" />
                                Copiar enlace
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                        isOriginal
                          ? isDark
                            ? "bg-[#1f3414] text-[#cbe4ab] ring-1 ring-[#4d6d37]"
                            : "bg-[#eaf5d8] text-[#2f5b1f] ring-1 ring-[#c6dba0]"
                          : isDark
                            ? "bg-[#182653] text-[#c6d5ff] ring-1 ring-[#4f67b9]"
                            : "bg-[#e9efff] text-[#2f448f] ring-1 ring-[#c9d6ff]"
                      }`}>
                        {isOriginal ? "Animal original" : "Variante"}
                      </span>
                      {rarityConfig ? (
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: rarityConfig.softColor, color: rarityConfig.color }}>
                          {rarityConfig.label}
                        </span>
                      ) : null}
                      {rarityConfig ? (
                        <span className="inline-flex items-center rounded-full bg-[var(--surface-100)] px-3 py-1 text-[11px] font-semibold text-[var(--ink-600)] ring-1 ring-black/[0.07]">
                          {rarityConfig.probability}% drop rate
                        </span>
                      ) : null}
                    </div>

                    {selectedDoflin.funFact ? (
                      <div className="rounded-2xl bg-[var(--surface-100)] p-4 ring-1 ring-black/[0.06]">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <SparklesIcon className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-500)]">Dato curioso</p>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--ink-700)]">{selectedDoflin.funFact}</p>
                      </div>
                    ) : null}

                    <div className={`flex items-center justify-between gap-3 rounded-2xl p-4 ring-1 ring-black/[0.06] ${
                      isAuthenticated && isOwned
                        ? isDark
                          ? "bg-[#1f3414]"
                          : "bg-[#eaf5d8]"
                        : "bg-[var(--surface-100)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isAuthenticated && isOwned ? "bg-[var(--brand-primary)]" : "bg-[var(--surface-50)] ring-1 ring-black/10"
                        }`}>
                          <CheckCircleIcon className={`h-5 w-5 ${isAuthenticated && isOwned ? "text-white" : "text-[var(--ink-300)]"}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ink-600)]">Tu colección</p>
                          <p className="text-sm font-semibold text-[var(--ink-900)]">
                            {isAuthenticated
                              ? isOwned ? "Ya la tienes ✓" : "No la tienes aún"
                              : "Crea cuenta gratis"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`shrink-0 ${isAuthenticated && !isOwned ? theme.primaryButton : ""}`}
                        variant={!isAuthenticated ? "secondary" : isOwned ? "secondary" : "primary"}
                        onClick={() => {
                          if (!isAuthenticated) { onRequestAuth(); return; }
                          if (isOwned) { onClearOwned(selectedDoflin.id); } else { onMarkOwned(selectedDoflin.id); }
                        }}
                      >
                        {!isAuthenticated ? "Entrar" : isOwned ? "Quitar" : "Marcar"}
                      </Button>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-black/[0.07] bg-[var(--surface-50)] p-4">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-400)]">Comprar sobres</p>
                    <div className="flex gap-2">
                      <Button asChild className={`flex-1 ${theme.primaryButton}`}>
                        <a href={shopUrl} onClick={() => onPurchaseIntent({ source: "modal_buy", packSize: 15, doflinId: selectedDoflin.id })}>
                          <ShoppingCartIcon className="h-4 w-4 shrink-0" />
                          <span className="flex flex-col items-start leading-tight">
                            <span className="font-bold">Sobre ×15</span>
                            <span className="text-[10px] opacity-75">Más chances</span>
                          </span>
                          <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">MEJOR</span>
                        </a>
                      </Button>
                      <Button asChild variant="secondary" className="w-[72px] shrink-0 flex-col gap-0 px-3 py-2 h-auto">
                        <a href={shopUrl} onClick={() => onPurchaseIntent({ source: "modal_buy", packSize: 5, doflinId: selectedDoflin.id })}>
                          <span className="text-sm font-bold">×5</span>
                          <span className="text-[10px] opacity-60">Probar</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {variants.length > 1 ? (
                <div className="border-t border-black/[0.06] bg-[var(--surface-50,#f9f9f9)] px-6 py-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
                    {groupStats?.total ?? variants.length} variantes · {selectedDoflin.baseModel}
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                    {variants.map((variant) => {
                      const isCurrent = variant.id === selectedDoflin.id;
                      const vRarity = toCatalogRarity(variant.rarity);
                      const vConfig = CATALOG_RARITY_CONFIG[vRarity];
                      return (
                        <button key={variant.id} type="button" onClick={() => onNavigate(variant)}
                          className={`group relative flex shrink-0 flex-col overflow-hidden rounded-xl bg-[var(--surface-50)] transition-all duration-150 ${
                            isCurrent
                              ? "shadow-[0_0_0_2.5px_var(--brand-primary),0_6px_20px_rgba(0,0,0,0.14)]"
                              : "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.10)]"
                          }`} style={{ width: 96 }}>
                          <div className="h-1 w-full" style={{ backgroundColor: vConfig.color }} />
                          <div className="relative h-[80px] w-full overflow-hidden" style={{ backgroundColor: vConfig.softColor }}>
                            {brokenVariantImageIds.has(variant.id) || !variant.imageUrl ? (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1 opacity-55">
                                <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none" style={{ color: vConfig.color }}>
                                  <path d="M16 28 C16 28 5 22 5 13 C5 7 10 3 16 3 C22 3 27 7 27 13 C27 22 16 28 16 28Z" fill="currentColor" opacity="0.18"/>
                                  <path d="M16 28 C16 28 5 22 5 13 C5 7 10 3 16 3 C22 3 27 7 27 13 C27 22 16 28 16 28Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
                                  <path d="M16 28 L16 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
                                  <path d="M16 14 C12 11 9 11 7 12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                  <path d="M16 14 C20 11 23 11 25 12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                  <path d="M16 19 C13 17 10 17 8 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                  <path d="M16 19 C19 17 22 17 24 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
                                </svg>
                              </div>
                            ) : (
                              <Image src={variant.imageUrl} alt={variant.name} fill
                                sizes="96px"
                                className="object-cover transition duration-200 group-hover:scale-[1.06]"
                                onError={() => onVariantImageBroken((prev) => { const next = new Set(prev); next.add(variant.id); return next; })}
                              />
                            )}
                            {isCurrent ? (
                              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: "var(--brand-primary)" }}>
                                <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-0.5 px-2 py-2">
                            <p className="truncate text-left text-[11px] font-semibold text-[var(--ink-900)]">
                              {variantLabel(variant.variantName)}
                            </p>
                            <span className="text-[9px] font-bold" style={{ color: vConfig.color }}>
                              {vConfig.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface AuthPromptDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  theme: UniverseTheme;
  onClose: () => void;
  onLogin: () => void;
}

function AuthPromptDialog({
  isOpen,
  isLoading,
  theme,
  onClose,
  onLogin,
}: AuthPromptDialogProps): React.JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guarda tu progreso con una cuenta</DialogTitle>
          <DialogDescription>
            Para guardar tu progreso necesitas una cuenta. Crea tu acceso con Google y sincroniza tus Doflins encontrados.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button className={theme.primaryButton} disabled={isLoading}
            onClick={() => { onClose(); void onLogin(); }}>
            {isLoading ? "Abriendo..." : "Continuar con Google"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Ahora no</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RevealExperienceProps {
  initialCollection?: CollectionItemDTO[];
  initialRemaining?: Record<Rarity, number>;
}

export function RevealExperience({
  initialCollection,
  initialRemaining,
}: RevealExperienceProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const dark = useDarkMode();
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
  const [_isAdminViewer, setIsAdminViewer] = useState(false);
  const [isAuthenticatedViewer, setIsAuthenticatedViewer] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [packPrices, setPackPrices] = useState<Record<number, { amount: string; currencyCode: string; variantId: string; productTitle: string; availableForSale: boolean }>>({});

  useEffect(() => {
    fetch(`/api/shop/products?universe=${activeUniverse}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const products = (data as { products?: Array<{ title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; variants: Array<{ id: string; availableForSale: boolean }> }> }).products ?? [];
        const map: Record<number, { amount: string; currencyCode: string; variantId: string; productTitle: string; availableForSale: boolean }> = {};
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
              };
            }
          }
        }
        if (Object.keys(map).length > 0) setPackPrices(map);
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

  const megaFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "megaanimals"),
    [filteredCollection],
  );

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
            label: "Mega Animals",
            sectionTitle: "Sección Mega Animals",
            packs: MEGA_PACKS,
            cards: megaFiltered,
            count: collectionCounts.mega,
            badgeClass: dark
              ? "bg-[#fff4d8] text-[#7a4e14] ring-1 ring-[#d8b870]"
              : "bg-[#fff4d8] text-[#7a4e14] ring-1 ring-[#d8b870]",
            cardClass: dark
              ? "ink-light border-[#e8cc90] bg-[linear-gradient(180deg,#fff8e4,#f8ead0)]"
              : "border-[#e8cc90] bg-[linear-gradient(180deg,#fff8e4,#f8ead0)]",
            ctaTitle: "Completa tu colección Mega Animals",
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedPurchaseUniverseLabel = selectedPurchaseUniverse === "animals" ? "Animals" : selectedPurchaseUniverse === "mega" ? "Mega Animals" : "Multiverse";
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
    // Multiverse
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
    // Si el servidor ya entregó los datos, no hacemos el fetch en cliente
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
  // initialCollection/initialRemaining son props del servidor (inmutables en runtime)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Usar la página /carta/[id] que tiene og:image dinámica para WhatsApp/Twitter
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
      // user cancelled share — ignore
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

  const mainInkScopeClass = !dark
    ? activeUniverse === "animals"
      ? "ink-light"
      : "ink-light-blue"
    : "";
  const ctaPrimaryButtonTextClass =
    activeUniverse === "animals" ? "!text-[#1f3b12]" : "!text-[#243271]";

  return (
    <main className={`relative overflow-hidden pb-36 transition-colors duration-500 md:pb-24 ${mainInkScopeClass}`} style={themeVars}>
      {isOffline ? (
        <div className="sticky top-14 z-50 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
          <WifiIcon className="h-4 w-4" />
          Sin conexión — los datos pueden estar desactualizados
        </div>
      ) : null}
      <div className={`pointer-events-none absolute inset-0 -z-30 ${activeTheme.pageGlow}`} />
      <div className={`pointer-events-none absolute inset-0 -z-20 ${activeTheme.pageGradient}`} />


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

        <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-10 sm:px-8 lg:px-10">
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

      <section className="mx-auto w-full max-w-6xl px-5 pt-4 pb-8 sm:px-8 lg:px-10" id="universo-activo">
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

        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-[var(--ink-500)]">
            {filteredCollection.length > 0 ? <><span className="font-semibold text-[var(--ink-700)]">{filteredCollection.length}</span> figuras en {activeConfig.label}</> : null}
          </p>
          <Button asChild size="sm" variant="secondary" className="shrink-0">
            <a href={shopUrl} onClick={() => handlePurchaseIntent({ source: "catalog_universe_buy", packSize: 15 })}>
              <ShoppingCartIcon className="h-3.5 w-3.5" /> Comprar x15
            </a>
          </Button>
        </div>

        <Card className={`sticky top-0 z-20 backdrop-blur-sm ${activeTheme.panelCard}`}>
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
          className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]"
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
              <div
                key={item.id}
                className="transition-transform duration-200 hover:-translate-y-1.5 hover:scale-[1.025] active:scale-[0.97]"
                style={index < 12 ? { animation: `fadeInUp 0.3s ease both`, animationDelay: `${Math.min(index, 11) * 0.04}s` } : undefined}
              >
              <Card
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: "0 280px",
                  boxShadow: RARITY_GLOW_CSS[item.rarity] ?? undefined,
                }}
                className={`relative overflow-hidden rounded-[2rem] border ${activeConfig.cardClass} ${isOwned ? "ring-2 ring-[var(--brand-primary)]/40" : ""}`}
              >
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

                  {packPrices[pack.packSize] ? (
                    <p className="mt-3 font-title text-2xl leading-none text-[var(--ink-900)]">
                      {new Intl.NumberFormat("es-MX", { style: "currency", currency: packPrices[pack.packSize].currencyCode, maximumFractionDigits: 0 }).format(Number(packPrices[pack.packSize].amount))}
                      <span className="ml-1.5 text-sm font-semibold text-[var(--ink-600)]">{packPrices[pack.packSize].currencyCode}</span>
                    </p>
                  ) : null}
                  <div className="mt-5 space-y-2">
                    {packPrices[pack.packSize]?.variantId ? (
                      <AddToCartButton
                        variantId={packPrices[pack.packSize].variantId}
                        productTitle={packPrices[pack.packSize].productTitle}
                        isSoldOut={!packPrices[pack.packSize].availableForSale}
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-[var(--background)]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2.5 backdrop-blur-md md:hidden">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
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
        </div>
      </div>
    </main>
  );
}
