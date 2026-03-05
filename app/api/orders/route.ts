import { NextResponse } from "next/server";

import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Tipos Shopify Admin ───────────────────────────────────────────────────────

interface ShopifyFulfillment {
  id: number;
  status: string;
  tracking_company: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
}

interface ShopifyLineItem {
  id: number;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  line_items: ShopifyLineItem[];
  fulfillments: ShopifyFulfillment[];
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

// ─── Cache de token (dura 24h) ────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_API_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_API_CLIENT_SECRET;

  // Fallback: token estático si está configurado (legacy)
  const staticToken = process.env.SHOPIFY_ADMIN_TOKEN;
  if (staticToken && !clientId) {
    return staticToken;
  }

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_API_CLIENT_ID o SHOPIFY_API_CLIENT_SECRET");
  }

  // Reusar token cacheado si no ha expirado (con 5 min de margen)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error obteniendo token Shopify: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

// ─── Helper: fetch órdenes del Admin API ──────────────────────────────────────

async function fetchOrdersByEmail(email: string): Promise<ShopifyOrder[]> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const version = process.env.SHOPIFY_API_VERSION ?? "2025-01";

  if (!domain) {
    throw new Error("SHOPIFY_STORE_DOMAIN no configurado");
  }

  const token = await getAdminToken();

  const url = new URL(`https://${domain}/admin/api/${version}/orders.json`);
  url.searchParams.set("email", email);
  url.searchParams.set("status", "any");
  url.searchParams.set("limit", "20");
  url.searchParams.set(
    "fields",
    "id,name,created_at,financial_status,fulfillment_status,total_price,currency,line_items,fulfillments",
  );

  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Shopify Admin API error: ${res.status}`);
  }

  const data = (await res.json()) as ShopifyOrdersResponse;
  return data.orders ?? [];
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ orders: [] });
  }

  const supabase = createSupabaseServerClientForRoute(request as import("next/server").NextRequest);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const orders = await fetchOrdersByEmail(user.email);

    // Devolver solo los campos que necesita el cliente
    const mapped = orders.map((o) => ({
      id: o.id,
      name: o.name,
      createdAt: o.created_at,
      financialStatus: o.financial_status,
      fulfillmentStatus: o.fulfillment_status,
      totalPrice: o.total_price,
      currency: o.currency,
      lineItems: o.line_items.map((li) => ({
        id: li.id,
        title: li.title,
        variantTitle: li.variant_title,
        quantity: li.quantity,
        price: li.price,
      })),
      tracking:
        o.fulfillments.length > 0
          ? {
              company: o.fulfillments[0]!.tracking_company,
              number: o.fulfillments[0]!.tracking_number,
              url: o.fulfillments[0]!.tracking_url,
              status: o.fulfillments[0]!.status,
            }
          : null,
    }));

    return NextResponse.json({ orders: mapped });
  } catch (err) {
    console.error("[orders] Error:", err);
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
  }
}
