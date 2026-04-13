import Link from "next/link";

import { SHOP_UNIVERSE_ORDER, getShopUniverseLandingContent } from "@/lib/shop/shop-universe-landing-content";
import type { UniverseFilter } from "@/lib/shopify/types";

interface ShopUniverseNavProps {
  currentUniverse?: UniverseFilter | null;
}

export function ShopUniverseNav({ currentUniverse }: ShopUniverseNavProps): React.JSX.Element {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Universos de compra">
      {SHOP_UNIVERSE_ORDER.map((universe) => {
        const content = getShopUniverseLandingContent(universe);
        const isCurrent = currentUniverse === universe;

        return (
          <Link
            key={universe}
            href={content.href}
            aria-current={isCurrent ? "page" : undefined}
            className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isCurrent
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md"
                : "border-black/10 bg-white/80 text-[var(--ink-800)] hover:bg-[var(--surface-100)]"
            }`}
          >
            {content.label}
          </Link>
        );
      })}
    </nav>
  );
}
