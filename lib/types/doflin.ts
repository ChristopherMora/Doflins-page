export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "ULTRA" | "MYTHIC";
export type PackSize = 1 | 3 | 5;

export interface DoflinDTO {
  id: number;
  name: string;
  series: string;
  collectionNumber: number;
  totalCollection: number;
  rarity: Rarity;
  probability: number;
  imageUrl: string;
  silhouetteUrl: string;
}

export interface RevealResponse {
  status: "ok";
  code: string;
  packSize: PackSize;
  firstScan: boolean;
  doflins: DoflinDTO[];
  highestRarity: Rarity;
  usedAt: string;
  scanCount: number;
}

export interface CollectionItemDTO {
  id: number;
  name: string;
  series: string;
  collectionNumber: number;
  rarity: Rarity;
  probability: number;
  imageUrl: string;
  silhouetteUrl: string;
  active: boolean;
}

export interface RemainingStatsResponse {
  status: "ok";
  remaining: Record<Rarity, number>;
  totalRemaining: number;
}
