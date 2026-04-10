"use client";

import { useEffect } from "react";

import { useShopAnalytics } from "@/lib/hooks/use-shop-analytics";
import type { UniverseFilter } from "@/lib/shopify/types";

interface ProductDetailAnalyticsProps {
  handle: string;
  title: string;
  priceCents: number;
  universe: UniverseFilter | null;
}

export function ProductDetailAnalytics({
  handle,
  title,
  priceCents,
  universe,
}: ProductDetailAnalyticsProps): null {
  const { trackProductView } = useShopAnalytics(universe ?? undefined);

  useEffect(() => {
    trackProductView(handle, title, priceCents);
  }, [handle, priceCents, title, trackProductView]);

  return null;
}
