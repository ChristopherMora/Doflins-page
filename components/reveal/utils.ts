import type { CatalogRarity } from "@/lib/constants/rarity";
import { CATALOG_RARITY_ORDER } from "@/lib/constants/rarity";
import type { CollectionItemDTO, PackSize } from "@/lib/types/doflin";

import type { RarityFilter, Universe } from "./types";

export function normalizeSeries(series: string): string {
  return series.trim().toLowerCase();
}

export function baseModelKey(item: Pick<CollectionItemDTO, "series" | "baseModel">): string {
  return `${normalizeSeries(item.series)}::${item.baseModel.trim().toLowerCase()}`;
}

export function isOriginalVariant(variantName: string): boolean {
  const normalized = variantName.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return ["original", "base", "clasico", "clásico", "default title", "default"].some((token) =>
    normalized.includes(token),
  );
}

export function variantLabel(variantName: string): string {
  const cleaned = variantName.trim();
  if (!cleaned || isOriginalVariant(cleaned)) {
    return "Original";
  }

  return cleaned;
}

export function toUniverse(value: string | null): Universe | null {
  if (!value) {
    return null;
  }

  return value === "animals" || value === "multiverse" || value === "mega" ? value : null;
}

export function toRarityFilter(value: string | null): RarityFilter | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "ALL") {
    return "all";
  }

  if (normalized === "ULTRA" || normalized === "MYTHIC") {
    return "LEGENDARY";
  }

  return CATALOG_RARITY_ORDER.includes(normalized as CatalogRarity) ? (normalized as CatalogRarity) : null;
}

export function universeFromSeries(series: string): Universe {
  const n = normalizeSeries(series);
  if (n === "multiverse") return "multiverse";
  if (n === "megaanimals") return "mega";
  return "animals";
}

export function withPurchaseQuery(baseUrl: string, options: { packSize: PackSize; universe: Universe }): string {
  const { packSize, universe } = options;
  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set("pack", String(packSize));
    parsed.searchParams.set("universe", universe);
    return parsed.toString();
  } catch {
    const join = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${join}pack=${packSize}&universe=${universe}`;
  }
}

export function buildPurchaseUrls(baseUrl: string, universe: Universe): Record<PackSize, string> {
  return {
    5: withPurchaseQuery(baseUrl, { packSize: 5, universe }),
    15: withPurchaseQuery(baseUrl, { packSize: 15, universe }),
    30: withPurchaseQuery(baseUrl, { packSize: 30, universe }),
  };
}

export function normalizeOwnedIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}
