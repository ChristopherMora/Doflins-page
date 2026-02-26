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
    color: "#7F856F",
    softColor: "#EEF1E2",
    glow: "shadow-[0_0_30px_rgba(127,133,111,0.35)]",
    probability: 45,
    description: "Habitante frecuente de la colección Animals",
  },
  RARE: {
    label: "Raro",
    color: "#2E7A4E",
    softColor: "#DCEFE3",
    glow: "shadow-[0_0_30px_rgba(46,122,78,0.35)]",
    probability: 25,
    description: "Aparece menos y sube valor de colección",
  },
  EPIC: {
    label: "Épico",
    color: "#B46A2D",
    softColor: "#F8E3D0",
    glow: "shadow-[0_0_30px_rgba(180,106,45,0.4)]",
    probability: 15,
    description: "Edición especial con acabado destacado",
  },
  LEGENDARY: {
    label: "Legendario",
    color: "#D59A1A",
    softColor: "#FBE9C2",
    glow: "shadow-[0_0_30px_rgba(213,154,26,0.45)]",
    probability: 8,
    description: "Muy limitado en circulación",
  },
  ULTRA: {
    label: "Ultra",
    color: "#B33A2C",
    softColor: "#F8D8D3",
    glow: "shadow-[0_0_30px_rgba(179,58,44,0.45)]",
    probability: 5,
    description: "Extremadamente raro en cada pack",
  },
  MYTHIC: {
    label: "Mítico",
    color: "#2A2A22",
    softColor: "#F6EFDB",
    glow: "shadow-[0_0_35px_rgba(212,175,55,0.55)]",
    probability: 2,
    description: "Edición secreta de la línea Animals",
  },
};

export function rarityLabel(rarity: Rarity): string {
  return RARITY_CONFIG[rarity].label;
}

export function rarityRank(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}
