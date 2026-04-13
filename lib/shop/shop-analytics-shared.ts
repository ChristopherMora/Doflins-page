export const SHOP_ANALYTICS_VISITOR_KEY = "doflins_visitor_id";
export const SHOP_ANALYTICS_VISIT_COUNT_KEY = "doflins_visit_count";
export const SHOP_ANALYTICS_SESSION_KEY = "doflins_shop_session";
export const SHOP_ANALYTICS_LAST_VISIT_KEY = "doflins_last_visit_ts";

export function isShopAnalyticsPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/" || pathname.startsWith("/shop");
}
