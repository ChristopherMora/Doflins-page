import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { referralCodes, referralUses } from "@/lib/db/schema";
import { createShopifyDiscountCode, getDiscountCodeUsage } from "@/lib/server/shopify-admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doflins.dofer.mx";

/** Genera un código único tipo DOF-XXXX a partir del email del usuario */
function generateCode(email: string): string {
  const prefix = email.split("@")[0]?.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() ?? "DOF";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

// GET /api/referral — devuelve el código del usuario autenticado (o lo crea)
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "Auth no configurado" }, { status: 503 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = getDb();

  // Buscar código existente
  const [existing] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.supabaseUserId, user.id))
    .limit(1);

  if (existing) {
    // Refrescar conteo desde Shopify si tiene IDs
    let usesCount = existing.usesCount;
    if (existing.shopifyPriceRuleId && existing.shopifyDiscountCodeId) {
      try {
        usesCount = await getDiscountCodeUsage(
          existing.shopifyPriceRuleId,
          existing.shopifyDiscountCodeId,
        );
        if (usesCount !== existing.usesCount) {
          await db
            .update(referralCodes)
            .set({ usesCount })
            .where(eq(referralCodes.id, existing.id));
        }
      } catch {
        // Si falla Shopify, usamos el conteo local sin romper la respuesta
      }
    }

    // Cargar usos recientes
    const uses = await db
      .select()
      .from(referralUses)
      .where(eq(referralUses.referralCodeId, existing.id))
      .limit(20);

    return NextResponse.json({
      code: existing.code,
      discountPercent: existing.discountPercent,
      usesCount,
      active: existing.active,
      pointsPerUse: 50,
      shareUrl: `${BASE_URL}?ref=${existing.code}`,
      shopifyCode: existing.code,
      uses: uses.map((u) => ({
        id: u.id,
        usedByEmail: u.usedByEmail ? maskEmail(u.usedByEmail) : null,
        discountApplied: u.discountApplied,
        createdAt: u.createdAt,
      })),
    });
  }

  // Crear nuevo código
  const email = user.email ?? `user_${user.id}@doflins`;
  const code = generateCode(email);

  let shopifyPriceRuleId: string | null = null;
  let shopifyDiscountCodeId: string | null = null;

  // Intentar crear en Shopify (si falla, igual guardamos el código en DB)
  try {
    const shopify = await createShopifyDiscountCode(code, 10);
    shopifyPriceRuleId = shopify.priceRuleId;
    shopifyDiscountCodeId = shopify.discountCodeId;
  } catch (err) {
    console.error("[referral] No se pudo crear discount code en Shopify:", err);
  }

  await db.insert(referralCodes).values({
    supabaseUserId: user.id,
    code,
    discountPercent: 10,
    shopifyPriceRuleId,
    shopifyDiscountCodeId,
    usesCount: 0,
    active: true,
  });

  return NextResponse.json({
    code,
    discountPercent: 10,
    usesCount: 0,
    active: true,
    pointsPerUse: 50,
    shareUrl: `${BASE_URL}?ref=${code}`,
    shopifyCode: code,
    uses: [],
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const masked = local.slice(0, 2) + "***";
  return `${masked}@${domain}`;
}
