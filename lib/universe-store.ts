/**
 * Lightweight universe store — communicates the active universe
 * (animals | multiverse) between components via CustomEvents + localStorage.
 * Works without any React Context or Zustand.
 */

export type Universe = "animals" | "multiverse";

const STORAGE_KEY = "doflins_universe";
const EVENT_NAME = "doflins:universe";

export function getStoredUniverse(): Universe {
  if (typeof window === "undefined") return "animals";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "multiverse" ? "multiverse" : "animals";
}

export function broadcastUniverse(u: Universe): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, u);
  window.dispatchEvent(new CustomEvent<{ universe: Universe }>(EVENT_NAME, { detail: { universe: u } }));
}

export function onUniverseChange(cb: (u: Universe) => void): () => void {
  const handler = (e: Event) => {
    cb((e as CustomEvent<{ universe: Universe }>).detail.universe);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
