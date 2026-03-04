/**
 * Lightweight universe store — communicates the active universe
 * (neutral | animals | multiverse) between components via CustomEvents + localStorage.
 * Works without any React Context or Zustand.
 */

export type Universe = "neutral" | "animals" | "multiverse";

const STORAGE_KEY = "doflins_universe";
const EVENT_NAME = "doflins:universe";

export function getStoredUniverse(): Universe {
  if (typeof window === "undefined") return "neutral";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "neutral") return "neutral";
  if (v === "animals") return "animals";
  if (v === "multiverse") return "multiverse";
  return "neutral";
}

export function broadcastUniverse(u: Universe): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, u);
  document.documentElement.dataset.universe = u;
  window.dispatchEvent(new CustomEvent<{ universe: Universe }>(EVENT_NAME, { detail: { universe: u } }));
}

export function onUniverseChange(cb: (u: Universe) => void): () => void {
  const handler = (e: Event) => {
    cb((e as CustomEvent<{ universe: Universe }>).detail.universe);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
