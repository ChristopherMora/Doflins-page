import { NextRequest, NextResponse } from "next/server";

import type { ShopProduct } from "@/lib/shopify/types";
import { rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { fetchShopProducts } from "@/lib/server/shopify-storefront";
import { productsQuerySchema } from "@/lib/validation/shopify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_CATALOG_CACHE_TTL_MS = 45_000;

function resolveCatalogCacheTtlMs(): number {
  const raw = process.env.SHOPIFY_CATALOG_CACHE_TTL_MS?.trim();
  if (!raw) {
    return DEFAULT_CATALOG_CACHE_TTL_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_CATALOG_CACHE_TTL_MS;
  }

  return Math.floor(parsed);
}

function isRealtimeQueryValue(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const CATALOG_CACHE_TTL_MS = resolveCatalogCacheTtlMs();

const catalogCache = new Map<
  string,
  {
    expiresAt: number;
    fetchedAt: string;
    products: ShopProduct[];
  }
>();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "shop_products", 80, 60_000);
  if (limited) {
    return limited;
  }

  const parsed = productsQuerySchema.safeParse({
    universe: request.nextUrl.searchParams.get("universe") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_query",
        message: "El parámetro universe debe ser animals, multiverse o mega.",
      },
      {
        status: 400,
      },
    );
  }

  const { universe } = parsed.data;
  const forceRealtime = isRealtimeQueryValue(request.nextUrl.searchParams.get("realtime"));
  const cacheKey = universe;
  const now = Date.now();
  const cached = catalogCache.get(cacheKey);

  if (!forceRealtime && cached && cached.expiresAt > now) {
    return NextResponse.json({
      status: "ok",
      universe,
      source: "shopify",
      cached: true,
      fetchedAt: cached.fetchedAt,
      products: cached.products,
    });
  }

  try {
    const products = await fetchShopProducts(universe);
    const fetchedAt = new Date().toISOString();
    if (CATALOG_CACHE_TTL_MS > 0) {
      catalogCache.set(cacheKey, {
        expiresAt: now + CATALOG_CACHE_TTL_MS,
        fetchedAt,
        products,
      });
    }

    return NextResponse.json({
      status: "ok",
      universe,
      source: "shopify",
      cached: false,
      realtime: forceRealtime,
      fetchedAt,
      products,
    });
  } catch (error) {
    console.error("shop/products error", error);
    return toApiErrorResponse(error);
  }
}
