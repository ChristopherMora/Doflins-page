import type { Metadata } from "next";

import { ShopAnalyticsDashboard } from "@/components/admin/shop-analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics Tienda | Admin DOFLINS",
  robots: { index: false },
};

export default function ShopAnalyticsPage(): React.JSX.Element {
  return <ShopAnalyticsDashboard />;
}
