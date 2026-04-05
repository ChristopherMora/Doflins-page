import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { tradeListings, tradeOffers, doflins } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE: cancel a listing (only owner can do this)
export async function DELETE(
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

  // Verify ownership and status
  const [listing] = await db
    .select({ status: tradeListings.status })
    .from(tradeListings)
    .where(
      and(
        eq(tradeListings.id, listingId),
        eq(tradeListings.supabaseUserId, user.id)
      )
    )
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      { error: "Intercambio no encontrado o no eres el propietario" },
      { status: 404 }
    );
  }

  if (listing.status !== "open") {
    return NextResponse.json(
      { error: "Este intercambio no puede ser cancelado" },
      { status: 400 }
    );
  }

  // Cancel the listing
  await db
    .update(tradeListings)
    .set({ status: "cancelled" })
    .where(eq(tradeListings.id, listingId));

  // Also reject all pending offers
  await db
    .update(tradeOffers)
    .set({ status: "rejected" })
    .where(
      and(
        eq(tradeOffers.listingId, listingId),
        eq(tradeOffers.status, "pending")
      )
    );

  return NextResponse.json({ success: true });
}

// GET: get listing details with offers (for owner)
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = getDb();

  const [listing] = await db
    .select({
      id: tradeListings.id,
      supabaseUserId: tradeListings.supabaseUserId,
      offeringDoflinId: tradeListings.offeringDoflinId,
      wantingDoflinId: tradeListings.wantingDoflinId,
      notes: tradeListings.notes,
      status: tradeListings.status,
      createdAt: tradeListings.createdAt,
    })
    .from(tradeListings)
    .where(eq(tradeListings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Intercambio no encontrado" }, { status: 404 });
  }

  // Get doflin details
  const [offeringDoflin] = await db
    .select({
      nombre: doflins.nombre,
      imagenUrl: doflins.imagenUrl,
      rareza: doflins.rareza,
    })
    .from(doflins)
    .where(eq(doflins.id, listing.offeringDoflinId))
    .limit(1);

  let wantingDoflin = null;
  if (listing.wantingDoflinId) {
    const [wantingRow] = await db
      .select({
        nombre: doflins.nombre,
        imagenUrl: doflins.imagenUrl,
        rareza: doflins.rareza,
      })
      .from(doflins)
      .where(eq(doflins.id, listing.wantingDoflinId))
      .limit(1);
    wantingDoflin = wantingRow ?? null;
  }

  return NextResponse.json({
    listing: {
      ...listing,
      offeringDoflin,
      wantingDoflin,
    },
  });
}
