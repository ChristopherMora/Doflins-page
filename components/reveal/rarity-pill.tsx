import { toCatalogRarity, CATALOG_RARITY_CONFIG } from "@/lib/constants/rarity";
import type { Rarity } from "@/lib/types/doflin";
import { Badge } from "@/components/ui/badge";

export function RarityPill({ rarity }: { rarity: Rarity }): React.JSX.Element {
  const catalogRarity = toCatalogRarity(rarity);
  const config = CATALOG_RARITY_CONFIG[catalogRarity];

  return (
    <Badge
      className="font-bold"
      style={{
        backgroundColor: config.softColor,
        color: config.color,
      }}
    >
      {config.label}
    </Badge>
  );
}
