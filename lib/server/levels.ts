/**
 * Sistema de niveles basado en puntos totales acumulados.
 * El nivel sube y nunca baja (se basa en totalEarned, no en balance).
 */

export const LEVELS = [
  { id: "sprout",     label: "Brote",        emoji: "🌱", min: 0    },
  { id: "explorer",  label: "Explorador",   emoji: "🐾", min: 200  },
  { id: "collector", label: "Coleccionista", emoji: "💎", min: 500  },
  { id: "legendary", label: "Legendario",   emoji: "⚡", min: 1000 },
  { id: "mythic",    label: "Mítico",       emoji: "👑", min: 2500 },
] as const;

export type Level = (typeof LEVELS)[number];

export function getLevel(totalEarned: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalEarned >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(totalEarned: number): (typeof LEVELS)[number] | null {
  const current = getLevel(totalEarned);
  const idx = LEVELS.findIndex((l) => l.id === current.id);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

/** Progreso hacia el siguiente nivel en porcentaje (0-100) */
export function getLevelProgress(totalEarned: number): number {
  const current = getLevel(totalEarned);
  const next = getNextLevel(totalEarned);
  if (!next) return 100;
  const range = next.min - current.min;
  const earned = totalEarned - current.min;
  return Math.min(100, Math.round((earned / range) * 100));
}
