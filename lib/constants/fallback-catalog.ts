import type { CollectionItemDTO, Rarity } from "@/lib/types/doflin";

interface CatalogSeedItem {
  nombre: string;
  serie: "Animals" | "Multiverse";
  rareza: Rarity;
  probabilidad: number;
}

const CATALOG_SEED: CatalogSeedItem[] = [
  { nombre: "Brisa Solar", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Jaguar Prisma", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Koala Bronce", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Lobo Ceniza", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Panda Nube", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Mono Magma", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Tigre Arena", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Pulpo Jade", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Axolote Coral", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Búho Cobre", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Tortuga Hielo", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Fénix Menta", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "León Quartz", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Delfín Aurora", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Coyote Volt", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Pantera Pixel", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Rana Nova", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Gacela Fractal", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Erizo Vapor", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Halcón Neon", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Lince Rayo", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Tiburón Cobalto", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Dragón Plasma", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Mantis Vortex", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Cuervo Quantum", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Fuego Ártico", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Centella Dorada", serie: "Multiverse", rareza: "LEGENDARY", probabilidad: 8 },
  { nombre: "Titanio Lunar", serie: "Multiverse", rareza: "LEGENDARY", probabilidad: 8 },
  { nombre: "Omega Carmesí", serie: "Multiverse", rareza: "ULTRA", probabilidad: 5 },
  { nombre: "Sombra Eterna", serie: "Multiverse", rareza: "MYTHIC", probabilidad: 2 },
];

export const FALLBACK_COLLECTION: CollectionItemDTO[] = CATALOG_SEED.map((item, index) => {
  const number = index + 1;
  const padded = String(number).padStart(2, "0");

  return {
    id: number,
    name: `Doflin ${item.nombre}`,
    baseModel: `Doflin ${item.nombre}`,
    variantName: "Original",
    series: item.serie,
    collectionNumber: number,
    rarity: item.rareza,
    probability: item.probabilidad,
    imageUrl: number === 1 ? "/images/doflins/demo-3d.svg" : `/images/doflins/doflin-${padded}.webp`,
    silhouetteUrl: number === 1 ? "/images/doflins/demo-silhouette.svg" : `/images/doflins/silueta-${padded}.webp`,
    active: true,
  };
});

export const FALLBACK_REMAINING_BY_RARITY: Record<Rarity, number> = {
  COMMON: 477,
  RARE: 265,
  EPIC: 159,
  LEGENDARY: 85,
  ULTRA: 53,
  MYTHIC: 21,
};

export const FALLBACK_REMAINING_TOTAL = Object.values(FALLBACK_REMAINING_BY_RARITY).reduce(
  (sum, value) => sum + value,
  0,
);
