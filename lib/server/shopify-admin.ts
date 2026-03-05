/**
 * Shopify Admin API — helper compartido para token y llamadas REST
 */

let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

export async function getShopifyAdminToken(): Promise<string> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_API_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_API_CLIENT_SECRET;
  const staticToken = process.env.SHOPIFY_ADMIN_TOKEN;

  if (staticToken && !clientId) return staticToken;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_API_CLIENT_ID o SHOPIFY_API_CLIENT_SECRET");
  }

  if (_cachedToken && Date.now() < _tokenExpiresAt - 5 * 60 * 1000) {
    return _cachedToken;
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
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Error obteniendo token Shopify Admin: ${res.status} – ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  _cachedToken = data.access_token;
  _tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return _cachedToken;
}

export async function shopifyAdminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const version = process.env.SHOPIFY_API_VERSION ?? "2025-01";
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN no configurado");

  const token = await getShopifyAdminToken();
  const url = `https://${domain}/admin/api/${version}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Shopify Admin ${path}: ${res.status} – ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Price Rules & Discount Codes ─────────────────────────────────────────────

export interface ShopifyPriceRule {
  id: number;
  title: string;
  value_type: string;
  value: string;
  customer_selection: string;
  target_type: string;
  target_selection: string;
  allocation_method: string;
  once_per_customer: boolean;
  usage_limit: number | null;
  starts_at: string;
  ends_at: string | null;
}

export interface ShopifyDiscountCode {
  id: number;
  code: string;
  usage_count: number;
  created_at: string;
}

/**
 * Crea un price rule + discount code en Shopify.
 * Devuelve los IDs para guardarlos en la DB.
 */
export async function createShopifyDiscountCode(
  code: string,
  discountPercent: number,
): Promise<{ priceRuleId: string; discountCodeId: string }> {
  // 1. Crear price rule
  const priceRuleRes = await shopifyAdminFetch<{ price_rule: ShopifyPriceRule }>(
    "/price_rules.json",
    {
      method: "POST",
      body: JSON.stringify({
        price_rule: {
          title: `Referido ${code}`,
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "percentage",
          value: `-${discountPercent}`,
          customer_selection: "all",
          starts_at: new Date().toISOString(),
          once_per_customer: true,
        },
      }),
    },
  );

  const priceRuleId = String(priceRuleRes.price_rule.id);

  // 2. Crear discount code bajo ese price rule
  const discountRes = await shopifyAdminFetch<{ discount_code: ShopifyDiscountCode }>(
    `/price_rules/${priceRuleId}/discount_codes.json`,
    {
      method: "POST",
      body: JSON.stringify({ discount_code: { code } }),
    },
  );

  return {
    priceRuleId,
    discountCodeId: String(discountRes.discount_code.id),
  };
}

/**
 * Obtiene el uso actual del discount code desde Shopify.
 */
export async function getDiscountCodeUsage(
  priceRuleId: string,
  discountCodeId: string,
): Promise<number> {
  const res = await shopifyAdminFetch<{ discount_code: ShopifyDiscountCode }>(
    `/price_rules/${priceRuleId}/discount_codes/${discountCodeId}.json`,
  );
  return res.discount_code.usage_count;
}
