import { count, sql, gte, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import { shopEvents } from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = Math.min(Math.max(Number(daysParam) || 30, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceWhere = gte(shopEvents.createdAt, since);

  const [
    funnelData,
    dailyEvents,
    topProducts,
    topSearches,
    hourlyActivity,
    sessionFunnels,
    universeBreakdown,
  ] = await Promise.all([
    // 1. Funnel counts: each step
    db
      .select({
        eventType: shopEvents.eventType,
        count: count(),
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(shopEvents.eventType),

    // 2. Daily event counts (for trend chart)
    db
      .select({
        date: sql<string>`DATE(${shopEvents.createdAt})`,
        eventType: shopEvents.eventType,
        count: count(),
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(sql`DATE(${shopEvents.createdAt})`, shopEvents.eventType)
      .orderBy(sql`DATE(${shopEvents.createdAt})`),

    // 3. Top products by views + add_to_cart (which products attract attention?)
    db
      .select({
        productHandle: shopEvents.productHandle,
        productTitle: shopEvents.productTitle,
        views: sql<number>`SUM(CASE WHEN ${shopEvents.eventType} IN ('product_view', 'product_click', 'quick_view_open') THEN 1 ELSE 0 END)`,
        addToCart: sql<number>`SUM(CASE WHEN ${shopEvents.eventType} = 'add_to_cart' THEN 1 ELSE 0 END)`,
        removed: sql<number>`SUM(CASE WHEN ${shopEvents.eventType} = 'remove_from_cart' THEN 1 ELSE 0 END)`,
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.productHandle} IS NOT NULL`,
        ),
      )
      .groupBy(shopEvents.productHandle, shopEvents.productTitle)
      .orderBy(sql`SUM(CASE WHEN ${shopEvents.eventType} IN ('product_view', 'product_click', 'quick_view_open') THEN 1 ELSE 0 END) DESC`)
      .limit(20),

    // 4. Top searches (what are people looking for?)
    db
      .select({
        query: shopEvents.searchQuery,
        count: count(),
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.eventType} = 'search'`,
          sql`${shopEvents.searchQuery} IS NOT NULL`,
        ),
      )
      .groupBy(shopEvents.searchQuery)
      .orderBy(sql`count(*) DESC`)
      .limit(20),

    // 5. Hourly distribution
    db
      .select({
        hour: sql<number>`HOUR(${shopEvents.createdAt})`,
        count: count(),
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(sql`HOUR(${shopEvents.createdAt})`),

    // 6. Session funnel analysis — count sessions that reached each step
    db
      .select({
        shopView: sql<number>`COUNT(DISTINCT CASE WHEN ${shopEvents.eventType} = 'shop_view' THEN ${shopEvents.sessionId} END)`,
        productView: sql<number>`COUNT(DISTINCT CASE WHEN ${shopEvents.eventType} IN ('product_view', 'product_click', 'quick_view_open') THEN ${shopEvents.sessionId} END)`,
        addToCart: sql<number>`COUNT(DISTINCT CASE WHEN ${shopEvents.eventType} = 'add_to_cart' THEN ${shopEvents.sessionId} END)`,
        cartView: sql<number>`COUNT(DISTINCT CASE WHEN ${shopEvents.eventType} = 'cart_view' THEN ${shopEvents.sessionId} END)`,
        checkoutStart: sql<number>`COUNT(DISTINCT CASE WHEN ${shopEvents.eventType} = 'checkout_start' THEN ${shopEvents.sessionId} END)`,
        checkoutComplete: sql<number>`COUNT(DISTINCT CASE WHEN ${shopEvents.eventType} = 'checkout_complete' THEN ${shopEvents.sessionId} END)`,
      })
      .from(shopEvents)
      .where(sinceWhere),

    // 7. Universe breakdown
    db
      .select({
        universe: shopEvents.universe,
        count: count(),
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.universe} IS NOT NULL`,
        ),
      )
      .groupBy(shopEvents.universe),
  ]);

  // Build funnel map
  const funnelMap = Object.fromEntries(
    funnelData.map((r) => [r.eventType, r.count]),
  ) as Record<string, number>;

  // Session funnel
  const sessionFunnel = sessionFunnels[0] ?? {
    shopView: 0,
    productView: 0,
    addToCart: 0,
    cartView: 0,
    checkoutStart: 0,
    checkoutComplete: 0,
  };

  // Calculate drop-off rates between funnel steps
  const funnelSteps = [
    { label: "Visitaron tienda", key: "shopView", count: Number(sessionFunnel.shopView) },
    { label: "Vieron producto", key: "productView", count: Number(sessionFunnel.productView) },
    { label: "Agregaron al carrito", key: "addToCart", count: Number(sessionFunnel.addToCart) },
    { label: "Abrieron carrito", key: "cartView", count: Number(sessionFunnel.cartView) },
    { label: "Iniciaron checkout", key: "checkoutStart", count: Number(sessionFunnel.checkoutStart) },
    { label: "Completaron compra", key: "checkoutComplete", count: Number(sessionFunnel.checkoutComplete) },
  ];

  const funnelWithDropoff = funnelSteps.map((step, i) => {
    const prev = i === 0 ? step.count : funnelSteps[i - 1].count;
    const dropoffRate = prev > 0 ? Math.round(((prev - step.count) / prev) * 1000) / 10 : 0;
    const conversionRate = funnelSteps[0].count > 0
      ? Math.round((step.count / funnelSteps[0].count) * 1000) / 10
      : 0;
    return { ...step, dropoffRate, conversionRate };
  });

  // Product conversion rates (views vs add-to-cart)
  const productConversion = topProducts.map((p) => ({
    ...p,
    views: Number(p.views),
    addToCart: Number(p.addToCart),
    removed: Number(p.removed),
    conversionRate:
      Number(p.views) > 0
        ? Math.round((Number(p.addToCart) / Number(p.views)) * 1000) / 10
        : 0,
  }));

  return NextResponse.json({
    days,
    funnel: funnelWithDropoff,
    funnelTotals: funnelMap,
    dailyEvents,
    productConversion,
    topSearches,
    hourlyActivity,
    universeBreakdown,
    totalSessions: Number(sessionFunnel.shopView),
    overallConversion:
      Number(sessionFunnel.shopView) > 0
        ? Math.round(
            (Number(sessionFunnel.checkoutStart) / Number(sessionFunnel.shopView)) * 1000,
          ) / 10
        : 0,
  });
}
