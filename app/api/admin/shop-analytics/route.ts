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
  const analyticsTimezoneOffset = process.env.SHOP_ANALYTICS_TIMEZONE_OFFSET ?? "-06:00";
  const localCreatedAt = sql`CONVERT_TZ(${shopEvents.createdAt}, '+00:00', ${analyticsTimezoneOffset})`;

  let funnelData, dailyEvents, topProducts, topSearches, hourlyActivity, sessionFunnels, universeBreakdown,
      trafficSources, deviceBreakdown, scrollDepthDist, webVitalsData, visitorTypes, cartTiming;

  try {
  [
    funnelData,
    dailyEvents,
    topProducts,
    topSearches,
    hourlyActivity,
    sessionFunnels,
    universeBreakdown,
    trafficSources,
    deviceBreakdown,
    scrollDepthDist,
    webVitalsData,
    visitorTypes,
    cartTiming,
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
        date: sql<string>`DATE(${localCreatedAt})`,
        eventType: shopEvents.eventType,
        count: count(),
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(sql`DATE(${localCreatedAt})`, shopEvents.eventType)
      .orderBy(sql`DATE(${localCreatedAt})`),

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
        hour: sql<number>`HOUR(${localCreatedAt})`,
        count: count(),
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(sql`HOUR(${localCreatedAt})`),

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

    // 8. Traffic sources (UTM breakdown)
    db
      .select({
        source: sql<string>`COALESCE(${shopEvents.utmSource}, 'directo')`,
        medium: sql<string>`COALESCE(${shopEvents.utmMedium}, 'none')`,
        campaign: sql<string>`COALESCE(${shopEvents.utmCampaign}, '')`,
        count: count(),
        sessions: sql<number>`COUNT(DISTINCT ${shopEvents.sessionId})`,
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(
        sql`COALESCE(${shopEvents.utmSource}, 'directo')`,
        sql`COALESCE(${shopEvents.utmMedium}, 'none')`,
        sql`COALESCE(${shopEvents.utmCampaign}, '')`,
      )
      .orderBy(sql`count(*) DESC`)
      .limit(20),

    // 9. Device type distribution
    db
      .select({
        deviceType: sql<string>`COALESCE(${shopEvents.deviceType}, 'unknown')`,
        count: count(),
        sessions: sql<number>`COUNT(DISTINCT ${shopEvents.sessionId})`,
      })
      .from(shopEvents)
      .where(sinceWhere)
      .groupBy(sql`COALESCE(${shopEvents.deviceType}, 'unknown')`),

    // 10. Scroll depth distribution
    db
      .select({
        scrollPercent: shopEvents.scrollPercent,
        count: count(),
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.eventType} = 'scroll_depth'`,
          sql`${shopEvents.scrollPercent} IS NOT NULL`,
        ),
      )
      .groupBy(shopEvents.scrollPercent)
      .orderBy(shopEvents.scrollPercent),

    // 11. Web vitals (p75 by metric name)
    db
      .select({
        metricName: shopEvents.metricName,
        p75: sql<string>`CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(GROUP_CONCAT(${shopEvents.metricValue} ORDER BY CAST(${shopEvents.metricValue} AS DECIMAL(10,2))), ',', CEIL(0.75 * COUNT(*))), ',', -1) AS CHAR)`,
        avg: sql<string>`ROUND(AVG(CAST(${shopEvents.metricValue} AS DECIMAL(10,2))), 1)`,
        count: count(),
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.eventType} = 'web_vital'`,
          sql`${shopEvents.metricName} IS NOT NULL`,
        ),
      )
      .groupBy(shopEvents.metricName),

    // 12. Returning vs new visitors
    db
      .select({
        visitorType: sql<string>`CASE WHEN ${shopEvents.visitNumber} <= 1 THEN 'new' WHEN ${shopEvents.visitNumber} BETWEEN 2 AND 3 THEN 'returning' ELSE 'loyal' END`,
        visitors: sql<number>`COUNT(DISTINCT ${shopEvents.visitorId})`,
        events: count(),
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.visitorId} IS NOT NULL`,
        ),
      )
      .groupBy(sql`CASE WHEN ${shopEvents.visitNumber} <= 1 THEN 'new' WHEN ${shopEvents.visitNumber} BETWEEN 2 AND 3 THEN 'returning' ELSE 'loyal' END`),

    // 13. Cart abandonment timing (avg time on page before exit for sessions with cart events)
    db
      .select({
        hasCart: sql<string>`CASE WHEN EXISTS(SELECT 1 FROM shop_events se2 WHERE se2.session_id = ${shopEvents.sessionId} AND se2.shop_event_type = 'add_to_cart') THEN 'with_cart' ELSE 'no_cart' END`,
        avgDuration: sql<string>`ROUND(AVG(${shopEvents.durationMs}) / 1000, 1)`,
        count: count(),
      })
      .from(shopEvents)
      .where(
        and(
          sinceWhere,
          sql`${shopEvents.eventType} = 'page_exit'`,
          sql`${shopEvents.durationMs} IS NOT NULL`,
        ),
      )
      .groupBy(sql`CASE WHEN EXISTS(SELECT 1 FROM shop_events se2 WHERE se2.session_id = ${shopEvents.sessionId} AND se2.shop_event_type = 'add_to_cart') THEN 'with_cart' ELSE 'no_cart' END`),
  ]);
  } catch (err) {
    // Table likely doesn't exist yet — return empty data
    const isTableMissing =
      err instanceof Error && /shop_events|doesn't exist|ER_NO_SUCH_TABLE/i.test(err.message);
    if (isTableMissing) {
      return NextResponse.json({
        days,
        funnel: [],
        funnelTotals: {},
        dailyEvents: [],
        productConversion: [],
        topSearches: [],
        hourlyActivity: [],
        universeBreakdown: [],
        trafficSources: [],
        deviceBreakdown: [],
        scrollDepthDist: [],
        webVitals: [],
        visitorTypes: [],
        cartTiming: [],
        totalSessions: 0,
        overallConversion: 0,
        _notice: "La tabla shop_events aún no existe. Ejecuta: npm run db:generate && npm run db:migrate",
      });
    }
    throw err;
  }

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
    trafficSources: trafficSources.map((r) => ({
      source: r.source,
      medium: r.medium,
      campaign: r.campaign,
      events: Number(r.count),
      sessions: Number(r.sessions),
    })),
    deviceBreakdown: deviceBreakdown.map((r) => ({
      deviceType: r.deviceType,
      events: Number(r.count),
      sessions: Number(r.sessions),
    })),
    scrollDepthDist: scrollDepthDist.map((r) => ({
      percent: Number(r.scrollPercent),
      count: Number(r.count),
    })),
    webVitals: webVitalsData.map((r) => ({
      name: r.metricName,
      p75: Number(r.p75),
      avg: Number(r.avg),
      samples: Number(r.count),
    })),
    visitorTypes: visitorTypes.map((r) => ({
      type: r.visitorType,
      visitors: Number(r.visitors),
      events: Number(r.events),
    })),
    cartTiming: cartTiming.map((r) => ({
      segment: r.hasCart,
      avgSeconds: Number(r.avgDuration),
      exits: Number(r.count),
    })),
    totalSessions: Number(sessionFunnel.shopView),
    overallConversion:
      Number(sessionFunnel.shopView) > 0
        ? Math.round(
            (Number(sessionFunnel.checkoutStart) / Number(sessionFunnel.shopView)) * 1000,
          ) / 10
        : 0,
  });
}
