import { and, eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import {
  doflins,
  tradeListings,
  tradeOffers,
  userCollectionProgress,
} from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: get all offers for a listing (only listing owner can see)
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const { id } = await context.params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = getDb();

  // Verify ownership
  const [listing] = await db
    .select({ supabaseUserId: tradeListings.supabaseUserId })
    .from(tradeListings)
    .where(eq(tradeListings.id, listingId))
    .limit(1);

  if (!listing || listing.supabaseUserId !== user.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  // Get all offers with doflin details
  const offers = await db
    .select({
      id: tradeOffers.id,
      offererUserId: tradeOffers.offererUserId,
      offeredDoflinId: tradeOffers.offeredDoflinId,
      message: tradeOffers.message,
      status: tradeOffers.status,
      createdAt: tradeOffers.createdAt,
      doflinNombre: doflins.nombre,
      doflinImagenUrl: doflins.imagenUrl,
      doflinRareza: doflins.rareza,
    })
    .from(tradeOffers)
    .innerJoin(doflins, eq(doflins.id, tradeOffers.offeredDoflinId))
    .where(eq(tradeOffers.listingId, listingId))
    .orderBy(desc(tradeOffers.createdAt));

  return NextResponse.json({ offers });
}

interface CreateOfferBody {
  offeredDoflinId: number;
  message?: string;
}

// POST: create an offer on a listing
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const { id } = await context.params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: CreateOfferBody;
  try {
    body = (await request.json()) as CreateOfferBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.offeredDoflinId || typeof body.offeredDoflinId !== "number") {
    return NextResponse.json(
      { error: "Debes especificar una figura para ofrecer" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Get listing and verify it's open
  const [listing] = await db
    .select({
      supabaseUserId: tradeListings.supabaseUserId,
      status: tradeListings.status,
      wantingDoflinId: tradeListings.wantingDoflinId,
    })
    .from(tradeListings)
    .where(eq(tradeListings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Intercambio no encontrado" }, { status: 404 });
  }

  if (listing.status !== "open") {
    return NextResponse.json(
      { error: "Este intercambio ya no está disponible" },
      { status: 400 }
    );
  }

  if (listing.supabaseUserId === user.id) {
    return NextResponse.json(
      { error: "No puedes hacer una oferta en tu propio intercambio" },
      { status: 400 }
    );
  }

  // Verify user owns the doflin they're offering
  const [owned] = await db
    .select({ id: userCollectionProgress.id })
    .from(userCollectionProgress)
    .where(
      and(
        eq(userCollectionProgress.supabaseUserId, user.id),
        eq(userCollectionProgress.doflinId, body.offeredDoflinId),
        eq(userCollectionProgress.owned, true)
      )
    )
    .limit(1);

  if (!owned) {
    return NextResponse.json(
      { error: "No tienes esta figura en tu colección" },
      { status: 400 }
    );
  }

  // Check if user already has a pending offer on this listing
  const [existingOffer] = await db
    .select({ id: tradeOffers.id })
    .from(tradeOffers)
    .where(
      and(
        eq(tradeOffers.listingId, listingId),
        eq(tradeOffers.offererUserId, user.id),
        eq(tradeOffers.status, "pending")
      )
    )
    .limit(1);

  if (existingOffer) {
    return NextResponse.json(
      { error: "Ya tienes una oferta pendiente en este intercambio" },
      { status: 400 }
    );
  }

  // Create the offer
  const result = await db.insert(tradeOffers).values({
    listingId,
    offererUserId: user.id,
    offeredDoflinId: body.offeredDoflinId,
    message: body.message ?? null,
  });

  return NextResponse.json({ success: true, offerId: result[0].insertId });
}
