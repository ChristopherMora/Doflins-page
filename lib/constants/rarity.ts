import type { Rarity } from "@/lib/types/doflin";

export const RARITY_ORDER: Rarity[] = [
  "COMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "ULTRA",
  "MYTHIC",
];

export const RARITY_CONFIG: Record<
  Rarity,
  {
    label: string;
    color: string;
    softColor: string;
    glow: string;
    probability: number;
    description: string;
  }
> = {
  COMMON: {
    label: "Común",
    color: "#9CA3AF",
    softColor: "#F3F4F6",
    glow: "shadow-[0_0_30px_rgba(156,163,175,0.35)]",
    probability: 45,
    description: "Parte esencial de la colección",
  },
  RARE: {
    label: "Raro",
    color: "#3B82F6",
    softColor: "#DBEAFE",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.35)]",
    probability: 25,
    description: "Más difícil de encontrar",
  },
  EPIC: {
    label: "Épico",
    color: "#A855F7",
    softColor: "#F3E8FF",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.4)]",
    probability: 15,
    description: "Edición especial",
  },
  LEGENDARY: {
    label: "Legendario",
    color: "#F59E0B",
    softColor: "#FEF3C7",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.45)]",
    probability: 8,
    description: "Muy limitado",
  },
  ULTRA: {
    label: "Ultra",
    color: "#EF4444",
    softColor: "#FEE2E2",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.45)]",
    probability: 5,
    description: "Extremadamente raro",
  },
  MYTHIC: {
    label: "Mítico",
    color: "#111827",
    softColor: "#F5F5F5",
    glow: "shadow-[0_0_35px_rgba(212,175,55,0.55)]",
    probability: 2,
    description: "Edición secreta",
  },
};

export function rarityLabel(rarity: Rarity): string {
  return RARITY_CONFIG[rarity].label;
}

export function rarityRank(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}
