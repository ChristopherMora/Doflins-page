import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { referralCodes, referralUses } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Verifica la firma HMAC-SHA256 del webhook de Shopify */
function verifyShopifyWebhook(
  rawBody: Buffer,
  hmacHeader: string,
  secret: string,
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hmacHeader),
    );
  } catch {
    return false;
  }
}

interface ShopifyOrderPayload {
  id: number;
  email: string;
  discount_codes: Array<{ code: string; amount: string; type: string }>;
  total_discounts: string;
  financial_status: string;
}

/**
 * POST /api/webhooks/shopify
 * Escucha el evento orders/paid y registra usos de código de referido
 * automáticamente.
 *
 * Configuración en Shopify Admin → Notifications → Webhooks:
 *   Topic: orders/paid
 *   URL: https://doflins.dofer.mx/api/webhooks/shopify
 *   Format: JSON
 *
 * Variable de entorno requerida: SHOPIFY_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    // Si no hay secret configurado, ignorar silenciosamente (no romper prod)
    return NextResponse.json({ ok: true });
  }

  // Leer cuerpo crudo para verificar HMAC
  const rawBody = Buffer.from(await request.arrayBuffer());
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") ?? "";

  if (!verifyShopifyWebhook(rawBody, hmacHeader, secret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic");
  if (topic !== "orders/paid") {
    // Ignorar otros topics
    return NextResponse.json({ ok: true });
  }

  let order: ShopifyOrderPayload;
  try {
    order = JSON.parse(rawBody.toString("utf-8")) as ShopifyOrderPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!order.discount_codes?.length) {
    return NextResponse.json({ ok: true, message: "Sin cupones" });
  }

  const db = getDb();

  for (const discount of order.discount_codes) {
    const code = discount.code.toUpperCase();

    // Buscar si el código pertenece a un referido activo
    const [referral] = await db
      .select()
      .from(referralCodes)
      .where(and(eq(referralCodes.code, code), eq(referralCodes.active, true)))
      .limit(1);

    if (!referral) continue;

    // Evitar duplicados: revisar si ya registramos este pedido
    const orderId = String(order.id);
    const [existing] = await db
      .select({ id: referralUses.id })
      .from(referralUses)
      .where(
        and(
          eq(referralUses.referralCodeId, referral.id),
          eq(referralUses.shopifyOrderId, orderId),
        ),
      )
      .limit(1);

    if (existing) continue;

    // Registrar el uso
    const discountAmount = Math.round(parseFloat(discount.amount) * 100); // centavos
    await db.insert(referralUses).values({
      referralCodeId: referral.id,
      usedByEmail: order.email ?? null,
      shopifyOrderId: orderId,
      discountApplied: discountAmount,
    });

    // Incrementar contador en referral_codes
    await db
      .update(referralCodes)
      .set({ usesCount: referral.usesCount + 1 })
      .where(eq(referralCodes.id, referral.id));
  }

  return NextResponse.json({ ok: true });
}
