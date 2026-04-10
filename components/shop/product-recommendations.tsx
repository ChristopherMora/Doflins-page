"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SparklesIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";

import type { ShopProduct } from "@/lib/shopify/types";
import { Badge } from "@/components/ui/badge";

const VIEWED_KEY = "doflins_viewed_products";
const MAX_VIEWED = 20;

/** Track a product view in localStorage */
export function trackProductView(handle: string, universe: string | null): void {
  if (typeof window === "undefined" || !handle) return;
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    const list: Array<{ handle: string; universe: string | null; ts: number }> = raw
      ? JSON.parse(raw)
      : [];

    // Remove duplicate and re-insert at front
    const filtered = list.filter((x) => x.handle !== handle);
    filtered.unshift({ handle, universe, ts: Date.now() });

    // Keep only recent
    localStorage.setItem(VIEWED_KEY, JSON.stringify(filtered.slice(0, MAX_VIEWED)));
  } catch {
    // Ignore
  }
}

function getViewedHandles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Array<{ handle: string }>;
    return list.map((x) => x.handle);
  } catch {
    return [];
  }
}

function getPreferredUniverse(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as Array<{ universe: string | null }>;
    // Count universes from recent views
    const counts = new Map<string, number>();
    for (const item of list.slice(0, 10)) {
      if (item.universe) {
        counts.set(item.universe, (counts.get(item.universe) ?? 0) + 1);
      }
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [u, c] of counts) {
      if (c > bestCount) { best = u; bestCount = c; }
    }
    return best;
  } catch {
    return null;
  }
}

function shopifyLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    if (quality) url.searchParams.set("quality", String(quality));
    return url.toString();
  } catch {
    return src;
  }
}

interface Props {
  products: ShopProduct[];
  currentHandle?: string;
  onAddToCart?: (product: ShopProduct) => void;
  isMutating?: boolean;
}

export function ProductRecommendations({ products, currentHandle, onAddToCart, isMutating }: Props): React.JSX.Element | null {
  const [viewedHandles, setViewedHandles] = useState<string[]>([]);
  const [preferredUniverse, setPreferredUniverse] = useState<string | null>(null);

  useEffect(() => {
    setViewedHandles(getViewedHandles());
    setPreferredUniverse(getPreferredUniverse());
  }, []);

  const recommendations = useMemo(() => {
    if (products.length === 0) return [];

    // Score each product
    const scored = products
      .filter((p) => p.handle !== currentHandle && p.availableForSale)
      .map((product) => {
        let score = 0;

        // Boost: same universe as what user browses most
        if (preferredUniverse && product.universe === preferredUniverse) {
          score += 3;
        }

        // Boost: NOT already viewed (discovery)
        if (!viewedHandles.includes(product.handle)) {
          score += 2;
        }

        // Boost: available variants
        const availableVariants = product.variants.filter((v) => v.availableForSale).length;
        if (availableVariants > 1) score += 1;

        // Small random jitter so recommendations feel fresh
        score += Math.random() * 0.5;

        return { product, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map((s) => s.product);
  }, [products, currentHandle, viewedHandles, preferredUniverse]);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-bold text-[var(--ink-900)]">
          También te puede gustar
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {recommendations.map((product) => {
          const price = product.price;
          return (
            <div
              key={product.handle}
              className="group flex flex-col overflow-hidden rounded-xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] transition hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-[var(--shop-image-panel-bg)]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt ?? product.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loader={shopifyLoader}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--ink-300)]">
                    <ShoppingCartIcon className="h-8 w-8" />
                  </div>
                )}
                {product.universe ? (
                  <Badge
                    variant="neutral"
                    className="absolute left-1.5 top-1.5 text-[9px] capitalize"
                  >
                    {product.universe}
                  </Badge>
                ) : null}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <p className="line-clamp-2 text-xs font-semibold leading-tight text-[var(--ink-800)]">
                  {product.title}
                </p>
                <p className="text-sm font-bold" style={{ color: "var(--shop-primary-from)" }}>
                  ${Number(price.amount).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  <span className="ml-0.5 text-[10px] font-normal text-[var(--ink-400)]">
                    {price.currencyCode}
                  </span>
                </p>
                {onAddToCart ? (
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={isMutating}
                    className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-[linear-gradient(135deg,var(--shop-primary-from),var(--shop-primary-to))] px-2 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    <ShoppingCartIcon className="h-3 w-3" />
                    Agregar
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
