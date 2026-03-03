/**
 * Achievement definitions — computed purely from collection data.
 * No database writes needed: achievements are derived on-the-fly.
 */

import type { Rarity } from "@/lib/types/doflin";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  /** Check if this achievement is unlocked given the collection state */
  check: (data: AchievementInput) => boolean;
}

export interface AchievementInput {
  totalOwned: number;
  totalDoflins: number;
  ownedByRarity: Record<string, number>;
  totalByRarity: Record<string, number>;
  series: string[];
}

const rarityOrder: Rarity[] = ["COMMON", "RARE", "EPIC", "LEGENDARY", "ULTRA", "MYTHIC"];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_figure",
    title: "Primera figura",
    description: "Marca tu primera figura como obtenida.",
    emoji: "🐾",
    color: "#7ab55c",
    check: ({ totalOwned }) => totalOwned >= 1,
  },
  {
    id: "five_figures",
    title: "Coleccionista novato",
    description: "Consigue 5 figuras.",
    emoji: "🌱",
    color: "#4e6f2a",
    check: ({ totalOwned }) => totalOwned >= 5,
  },
  {
    id: "ten_figures",
    title: "Coleccionista bronze",
    description: "Consigue 10 figuras.",
    emoji: "🥉",
    color: "#b87333",
    check: ({ totalOwned }) => totalOwned >= 10,
  },
  {
    id: "twenty_figures",
    title: "Coleccionista silver",
    description: "Consigue 20 figuras.",
    emoji: "🥈",
    color: "#9badbe",
    check: ({ totalOwned }) => totalOwned >= 20,
  },
  {
    id: "fifty_figures",
    title: "Coleccionista gold",
    description: "Consigue 50 figuras.",
    emoji: "🥇",
    color: "#D59A1A",
    check: ({ totalOwned }) => totalOwned >= 50,
  },
  {
    id: "half_collection",
    title: "A mitad de camino",
    description: "Completa el 50% de la colección.",
    emoji: "⭐",
    color: "#cc8b33",
    check: ({ totalOwned, totalDoflins }) =>
      totalDoflins > 0 && totalOwned / totalDoflins >= 0.5,
  },
  {
    id: "complete_collection",
    title: "Colección completa",
    description: "¡Tienes todas las figuras!",
    emoji: "👑",
    color: "#D59A1A",
    check: ({ totalOwned, totalDoflins }) =>
      totalDoflins > 0 && totalOwned >= totalDoflins,
  },
  {
    id: "rare_found",
    title: "Detecta lo raro",
    description: "Consigue una figura Rara o superior.",
    emoji: "💎",
    color: "#2E7A4E",
    check: ({ ownedByRarity }) =>
      (ownedByRarity["RARE"] ?? 0) +
        (ownedByRarity["EPIC"] ?? 0) +
        (ownedByRarity["LEGENDARY"] ?? 0) +
        (ownedByRarity["ULTRA"] ?? 0) +
        (ownedByRarity["MYTHIC"] ?? 0) >= 1,
  },
  {
    id: "epic_found",
    title: "Toque épico",
    description: "Consigue una figura Épica.",
    emoji: "🔥",
    color: "#B46A2D",
    check: ({ ownedByRarity }) =>
      (ownedByRarity["EPIC"] ?? 0) >= 1,
  },
  {
    id: "legendary_found",
    title: "¡Legendaria!",
    description: "Consigue tu primera figura Legendaria.",
    emoji: "⚡",
    color: "#D59A1A",
    check: ({ ownedByRarity }) =>
      (ownedByRarity["LEGENDARY"] ?? 0) >= 1,
  },
  {
    id: "mythic_found",
    title: "Mítico entre mortales",
    description: "Consigue una figura Mítica. Increíble.",
    emoji: "🌟",
    color: "#2A2A22",
    check: ({ ownedByRarity }) =>
      (ownedByRarity["MYTHIC"] ?? 0) >= 1,
  },
  {
    id: "all_common",
    title: "Sin dejar rastro",
    description: "Tienes todas las figuras Comunes.",
    emoji: "✅",
    color: "#7F856F",
    check: ({ ownedByRarity, totalByRarity }) =>
      (totalByRarity["COMMON"] ?? 0) > 0 &&
      (ownedByRarity["COMMON"] ?? 0) >= (totalByRarity["COMMON"] ?? 0),
  },
  {
    id: "all_rare",
    title: "Caza de especiales",
    description: "Tienes todas las figuras Raras.",
    emoji: "🌿",
    color: "#2E7A4E",
    check: ({ ownedByRarity, totalByRarity }) =>
      (totalByRarity["RARE"] ?? 0) > 0 &&
      (ownedByRarity["RARE"] ?? 0) >= (totalByRarity["RARE"] ?? 0),
  },
  {
    id: "animals_series",
    title: "Guardián Animals",
    description: "Tienes al menos una figura de la serie Animals.",
    emoji: "🐆",
    color: "#4e6f2a",
    check: ({ series }) => series.includes("Animals"),
  },
  {
    id: "multiverse_series",
    title: "Maestro del Multiverso",
    description: "Tienes al menos una figura de la serie Multiverse.",
    emoji: "🌌",
    color: "#4a3c8c",
    check: ({ series }) => series.includes("Multiverse"),
  },
  {
    id: "both_universes",
    title: "Explorador total",
    description: "Tienes figuras de ambos universos.",
    emoji: "🗺️",
    color: "#cc8b33",
    check: ({ series }) =>
      series.includes("Animals") && series.includes("Multiverse"),
  },
];

export function computeAchievements(input: AchievementInput) {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlocked: achievement.check(input),
  }));
}
