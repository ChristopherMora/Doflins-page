import {
  BoltIcon,
  FireIcon,
  GlobeAltIcon,
  MapIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import {
  CATALOG_RARITY_CONFIG,
  CATALOG_RARITY_ORDER,
} from "@/lib/constants/rarity";

import type { BuyPackOption, DoflinModelConfig, PackOption, RarityFilter } from "./types";

// ─── Images & keys ──────────────────────────────────────────────────────────

export const FALLBACK_DOFLIN_IMAGE = "/images/placeholders/doflin-placeholder.svg";
export const ACTIVE_SERIES = ["Animals", "Multiverse", "MegaAnimals"] as const;
export const UNIVERSE_STORAGE_KEY = "doflins_last_universe_v1";
export const CATALOG_PAGE_SIZE = 10;

// ─── Pack configs per universe ──────────────────────────────────────────────

export const ANIMALS_PACKS: PackOption[] = [
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

export const MULTIVERSE_PACKS: PackOption[] = [
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

export const MEGA_PACKS: PackOption[] = [
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

// ─── Visual constants ───────────────────────────────────────────────────────

export const RARITY_GLOW_CSS: Partial<Record<string, string>> = {
  LEGENDARY: "0 0 18px rgba(213,154,26,0.55), 0 0 38px rgba(213,154,26,0.22)",
  ULTRA:     "0 0 18px rgba(179,58,44,0.55),  0 0 38px rgba(179,58,44,0.20)",
  MYTHIC:    "0 0 22px rgba(212,175,55,0.65), 0 0 52px rgba(212,175,55,0.28)",
  EPIC:      "0 0 12px rgba(180,106,45,0.40)",
  RARE:      "0 0 10px rgba(46,122,78,0.30)",
};

export const PARTICLE_COLOR: Partial<Record<string, string>> = {
  LEGENDARY: "rgba(213,154,26,0.75)",
  ULTRA:     "rgba(220,80,60,0.75)",
  MYTHIC:    "rgba(212,175,55,0.85)",
};

export const RARITY_FILTER_OPTIONS: { value: RarityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...CATALOG_RARITY_ORDER.map((rarity) => ({
    value: rarity,
    label: CATALOG_RARITY_CONFIG[rarity].label,
  })),
];

// ─── Buy pack options & model config ────────────────────────────────────────

export const BUY_PACK_OPTIONS: BuyPackOption[] = [
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

export const MODEL_CONFIG_BY_COLLECTION: Partial<Record<number, DoflinModelConfig>> = {
};
