import type { CollectionItemDTO, Rarity } from "@/lib/types/doflin";

interface CatalogSeedItem {
  nombre: string;
  modeloBase?: string;
  variante?: string;
  serie: "Animals" | "Multiverse";
  rareza: Rarity;
  probabilidad: number;
}

// Catálogo de respaldo vacío — se muestra solo si la DB no está disponible.
// Agrega aquí los doflins reales si quieres un fallback con datos válidos.
const CATALOG_SEED: CatalogSeedItem[] = [];

export const FALLBACK_COLLECTION: CollectionItemDTO[] = CATALOG_SEED.map((item, index) => {
  const number = index + 1;
  const padded = String(number).padStart(2, "0");

  return {
    id: number,
    name: `Doflin ${item.nombre}`,
    baseModel: item.modeloBase ?? `Doflin ${item.nombre}`,
    variantName: item.variante ?? "Original",
    series: item.serie,
    collectionNumber: number,
    rarity: item.rareza,
    probability: item.probabilidad,
    imageUrl: `/images/doflins/doflin-${padded}.webp`,
    silhouetteUrl: `/images/doflins/silueta-${padded}.webp`,
    active: true,
  };
});

export const FALLBACK_REMAINING_BY_RARITY: Record<Rarity, number> = {
  COMMON: 0,
  RARE: 0,
  EPIC: 0,
  LEGENDARY: 0,
  ULTRA: 0,
  MYTHIC: 0,
};

export const FALLBACK_REMAINING_TOTAL = Object.values(FALLBACK_REMAINING_BY_RARITY).reduce(
  (sum, value) => sum + value,
  0,
);
