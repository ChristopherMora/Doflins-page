import type { CatalogRarity } from "@/lib/constants/rarity";
import type { CollectionItemDTO, PackSize, Rarity } from "@/lib/types/doflin";

export type Universe = "animals" | "multiverse" | "mega";
export type RarityFilter = "all" | CatalogRarity;

export interface CollectionPayload {
  status: "ok";
  collection: CollectionItemDTO[];
}

export interface RemainingPayload {
  status: "ok";
  remaining: Record<Rarity, number>;
  totalRemaining: number;
}

export interface AdminStatusPayload {
  status: "ok";
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string | null;
}

export interface ProgressPayload {
  status: "ok";
  ownedIds: number[];
}

export interface PackOption {
  name: string;
  pieces: number;
  detail: string;
  icon: React.ElementType;
  cardClassName: string;
}

export interface UniverseTheme {
  pageGlow: string;
  pageGradient: string;
  headerShell: string;
  logoGradient: string;
  primaryButton: string;
  pillButton: string;
  heroBadge: string;
  heroChip: string;
  heroStateCard: string;
  heroStateInfo: string;
  panelCard: string;
  rarityInfoChip: string;
  rarityCard: string;
  platformCard: string;
  ctaCard: string;
  ctaPrimaryText: string;
  heroTitle: string;
  heroDescription: string;
  heroTag: string;
  qrNarrative: string;
}

export interface DoflinModelConfig {
  modelUrl: string;
  orientation?: string;
  cameraOrbit?: string;
  fieldOfView?: string;
}

export interface BuyPackOption {
  packSize: PackSize;
  title: string;
  subtitle: string;
  benefit: string;
}

export type TrackedEvent = "universe_switch" | "filter_apply" | "card_open" | "view_3d";

export interface DoflinModalProps {
  selectedDoflin: CollectionItemDTO | null;
  onClose: () => void;
  catalog: CollectionItemDTO[];
  catalogIndex: number;
  onNavigate: (item: CollectionItemDTO) => void;
  has3DModel: boolean;
  modelConfig: DoflinModelConfig | undefined;
  purchaseUniverse: Universe;
  rarityConfig: { color: string; softColor: string; label: string; probability: number } | null;
  isOriginal: boolean;
  isOwned: boolean;
  groupStats: { total: number; originals: number; variants: number } | undefined;
  variants: CollectionItemDTO[];
  imageSrc: string;
  shopUrl: string;
  isAuthenticated: boolean;
  isDark: boolean;
  theme: UniverseTheme;
  onShare: () => void;
  onMarkOwned: (id: number) => void;
  onClearOwned: (id: number) => void;
  onPurchaseIntent: (opts?: { source?: string; packSize?: PackSize; doflinId?: number }) => void;
  onRequestAuth: () => void;
  brokenImageIds: number[];
  onImageBroken: React.Dispatch<React.SetStateAction<number[]>>;
  brokenVariantImageIds: Set<number>;
  onVariantImageBroken: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export interface AuthPromptDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  theme: UniverseTheme;
  onClose: () => void;
  onLogin: () => void;
}
