import type { CollectionItemDTO, Rarity } from "@/lib/types/doflin";
import { RARITY_CONFIG } from "@/lib/constants/rarity";

// ── API response types ──────────────────────────────────────────────────────
export interface AdminCollectionResponse {
  status: "ok";
  items: AdminDoflinItem[];
}

export interface AdminDoflinItem extends CollectionItemDTO {
  slug: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateDoflinResponse {
  status: "ok" | "error";
  message?: string;
  doflin?: AdminDoflinItem;
  item?: AdminDoflinItem;
}

// ── Form types ──────────────────────────────────────────────────────────────
export type VariantMode = "original" | "variant";

export interface FormValues {
  name: string;
  variantMode: VariantMode;
  baseModel: string;
  variantName: string;
  series: "Animals" | "Multiverse" | "MegaAnimals";
  collectionNumber: string;
  rarity: Rarity;
  probability: string;
  active: boolean;
}

export interface BulkValues {
  series: "Animals" | "Multiverse" | "MegaAnimals";
  baseModel: string;
  startCollectionNumber: string;
  rarity: Rarity;
  probability: string;
  active: boolean;
}

export interface EditValues {
  name: string;
  baseModel: string;
  variantName: string;
  series: "Animals" | "Multiverse" | "MegaAnimals";
  collectionNumber: string;
  rarity: Rarity;
  probability: string;
  active: boolean;
  funFact: string;
}

export interface CsvRow {
  nombre: string;
  serie: "Animals" | "Multiverse" | "MegaAnimals";
  rareza: Rarity;
  probabilidad: string;
  numeroColeccion: string;
  modeloBase: string;
  variantName: string;
}

export interface DoflinAdminFormProps {
  requireToken?: boolean;
}

// ── Constants ───────────────────────────────────────────────────────────────
export const INITIAL_VALUES: FormValues = {
  name: "",
  variantMode: "original",
  baseModel: "",
  variantName: "Original",
  series: "Animals",
  collectionNumber: "",
  rarity: "COMMON",
  probability: String(RARITY_CONFIG.COMMON.probability),
  active: true,
};

export const INITIAL_BULK_VALUES: BulkValues = {
  series: "Animals",
  baseModel: "",
  startCollectionNumber: "",
  rarity: "COMMON",
  probability: String(RARITY_CONFIG.COMMON.probability),
  active: true,
};

export const ADMIN_TOKEN_STORAGE_KEY = "doflins_admin_token";
