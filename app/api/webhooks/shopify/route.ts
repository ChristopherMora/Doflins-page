import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { referralCodes, referralUses, shopEvents } from "@/lib/db/schema";
import { awardPurchasePoints, awardPoints } from "@/lib/server/points";
import { sendPurchaseConfirmation } from "@/lib/server/emails";
import { hashIp } from "@/lib/server/request";
import { logShopEvent } from "@/lib/server/shop-analytics";

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
  total_price: string;
  financial_status: string;
  note_attributes?: Array<{ name?: string; key?: string; value?: string }>;
  customer?: { id: number; email: string };
}

function getNoteAttribute(
  order: ShopifyOrderPayload,
  key: string,
): string | undefined {
  const value = order.note_attributes?.find((attribute) =>
    attribute.name === key || attribute.key === key,
  )?.value;

  return value?.trim() || undefined;
}

async function logCheckoutComplete(order: ShopifyOrderPayload): Promise<void> {
  const sessionId = getNoteAttribute(order, "doflins_session_id");
  if (!sessionId) return;

  const orderId = String(order.id);
  const db = getDb();
  const [existing] = await db
    .select({ id: shopEvents.id })
    .from(shopEvents)
    .where(
      and(
        eq(shopEvents.eventType, "checkout_complete"),
        eq(shopEvents.filterValue, orderId),
      ),
    )
    .limit(1);

  if (existing) return;

  const visitorId = getNoteAttribute(order, "doflins_visitor_id");
  const visitNumberRaw = getNoteAttribute(order, "doflins_visit_number");
  const deviceTypeRaw = getNoteAttribute(order, "doflins_device_type");
  const universe = getNoteAttribute(order, "doflins_universe");
  const utmSource = getNoteAttribute(order, "doflins_utm_source");
  const utmMedium = getNoteAttribute(order, "doflins_utm_medium");
  const utmCampaign = getNoteAttribute(order, "doflins_utm_campaign");
  const totalPrice = Number.parseFloat(order.total_price ?? "0");

  await logShopEvent({
    sessionId,
    visitorId,
    visitNumber:
      typeof visitNumberRaw === "string" && /^\d+$/.test(visitNumberRaw)
        ? Number.parseInt(visitNumberRaw, 10)
        : undefined,
    eventType: "checkout_complete",
    filterValue: orderId,
    universe,
    cartTotalCents:
      Number.isFinite(totalPrice) && totalPrice > 0
        ? Math.round(totalPrice * 100)
        : undefined,
    utmSource,
    utmMedium,
    utmCampaign,
    deviceType:
      deviceTypeRaw === "mobile" || deviceTypeRaw === "tablet" || deviceTypeRaw === "desktop"
        ? deviceTypeRaw
        : undefined,
    ipHash: hashIp(`shopify-webhook:${orderId}`),
    userAgent: "shopify-webhook/orders-paid",
    database: db,
  });
}

/**
 * Intenta otorgar puntos de compra al usuario si podemos encontrar su userId
 * por email en la tabla user_profiles. Fire-and-forget.
 */
async function tryAwardPurchasePoints(order: ShopifyOrderPayload): Promise<void> {
  if (!order.email || !order.total_price) return;
  const amountMxn = parseFloat(order.total_price);
  if (isNaN(amountMxn) || amountMxn <= 0) return;

  try {
    const db = getDb();

    // Buscar usuario por email de forma case-insensitive
    const { userCollectionProgress } = await import("@/lib/db/schema");
    const normalizedEmail = order.email.toLowerCase();
    const [row] = await db
      .select({ supabaseUserId: userCollectionProgress.supabaseUserId })
      .from(userCollectionProgress)
      .where(sql`LOWER(${userCollectionProgress.userEmail}) = ${normalizedEmail}`)
      .limit(1);

    if (!row) return;

    await awardPurchasePoints(row.supabaseUserId, amountMxn, String(order.id));
  } catch {
    // No bloquear el webhook si falla la búsqueda
  }
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

  try {
    await logCheckoutComplete(order);
  } catch (error) {
    console.error("shopify webhook checkout_complete error", error);
  }

  if (!order.discount_codes?.length) {
    // Sin cupones — igual otorgar puntos por la compra si tenemos el email del usuario
    await tryAwardPurchasePoints(order);
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

    // Incrementar contador de forma atómica para evitar race conditions
    await db
      .update(referralCodes)
      .set({ usesCount: sql`${referralCodes.usesCount} + 1` })
      .where(eq(referralCodes.id, referral.id));

    // Otorgar puntos al dueño del código de referido
    void awardPoints(referral.supabaseUserId, 50, "referral_used", {
      shopifyOrderId: orderId,
      usedByEmail: order.email ?? null,
    }).catch(() => { /* no bloquear */ });

    // Otorgar bonus de referido al comprador que usó el código
    if (order.email) {
      void (async () => {
        try {
          const { userCollectionProgress } = await import("@/lib/db/schema");
          const db = getDb();
          const buyerEmail = order.email.toLowerCase();
          const [buyer] = await db
            .select({ supabaseUserId: userCollectionProgress.supabaseUserId })
            .from(userCollectionProgress)
            .where(sql`LOWER(${userCollectionProgress.userEmail}) = ${buyerEmail}`)
            .limit(1);
          if (buyer) {
            await awardPoints(buyer.supabaseUserId, 25, "referral_used", {
              shopifyOrderId: orderId,
              referralCode: code,
              role: "buyer",
            });
          }
        } catch { /* no bloquear */ }
      })();
    }
  }

  // Otorgar puntos por la compra al comprador
  await tryAwardPurchasePoints(order);

  // Enviar email de confirmación de compra (fire-and-forget)
  if (order.email) {
    const amountMxn = parseFloat(order.total_price ?? "0");
    const purchasePoints = !isNaN(amountMxn) && amountMxn > 0
      ? Math.floor(amountMxn / 100) * 5
      : 0;
    const hasReferral = order.discount_codes?.some((d) =>
      d.code && d.code.length >= 4
    );
    void sendPurchaseConfirmation({
      to: order.email,
      orderTotal: String(amountMxn > 0 ? amountMxn : order.total_price),
      pointsAwarded: purchasePoints,
      referralBonus: hasReferral ? 25 : undefined,
    }).catch(() => { /* no bloquear webhook */ });
  }

  return NextResponse.json({ ok: true });
}
