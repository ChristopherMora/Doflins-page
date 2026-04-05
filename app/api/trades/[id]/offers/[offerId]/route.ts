import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import {
  tradeListings,
  tradeOffers,
  userCollectionProgress,
} from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; offerId: string }>;
}

interface ActionBody {
  action: "accept" | "reject";
}

// POST: accept or reject an offer
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const { id, offerId } = await context.params;
  const listingId = parseInt(id, 10);
  const offerIdNum = parseInt(offerId, 10);
  
  if (isNaN(listingId) || isNaN(offerIdNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.action !== "accept" && body.action !== "reject") {
    return NextResponse.json(
      { error: "Acción inválida. Usa 'accept' o 'reject'" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Verify listing ownership and status
  const [listing] = await db
    .select({
      supabaseUserId: tradeListings.supabaseUserId,
      status: tradeListings.status,
      offeringDoflinId: tradeListings.offeringDoflinId,
    })
    .from(tradeListings)
    .where(eq(tradeListings.id, listingId))
    .limit(1);

  if (!listing || listing.supabaseUserId !== user.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  if (listing.status !== "open") {
    return NextResponse.json(
      { error: "Este intercambio ya no está disponible" },
      { status: 400 }
    );
  }

  // Get the offer
  const [offer] = await db
    .select({
      status: tradeOffers.status,
      offererUserId: tradeOffers.offererUserId,
      offeredDoflinId: tradeOffers.offeredDoflinId,
    })
    .from(tradeOffers)
    .where(
      and(eq(tradeOffers.id, offerIdNum), eq(tradeOffers.listingId, listingId))
    )
    .limit(1);

  if (!offer) {
    return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
  }

  if (offer.status !== "pending") {
    return NextResponse.json(
      { error: "Esta oferta ya fue procesada" },
      { status: 400 }
    );
  }

  if (body.action === "reject") {
    // Simply reject the offer
    await db
      .update(tradeOffers)
      .set({ status: "rejected" })
      .where(eq(tradeOffers.id, offerIdNum));

    return NextResponse.json({ success: true, action: "rejected" });
  }

  // Accept the offer - this is the trade execution
  // 1. Mark offer as accepted
  // 2. Mark listing as completed
  // 3. Reject all other pending offers
  // 4. Transfer figure ownership

  // Transaction-like operations
  try {
    // Update offer status
    await db
      .update(tradeOffers)
      .set({ status: "accepted" })
      .where(eq(tradeOffers.id, offerIdNum));

    // Update listing status
    await db
      .update(tradeListings)
      .set({ status: "completed" })
      .where(eq(tradeListings.id, listingId));

    // Reject other pending offers
    await db
      .update(tradeOffers)
      .set({ status: "rejected" })
      .where(
        and(
          eq(tradeOffers.listingId, listingId),
          eq(tradeOffers.status, "pending")
        )
      );

    // Transfer figures:
    // 1. Remove listing owner's offering doflin, add offerer's doflin
    // 2. Remove offerer's offered doflin, add listing owner's doflin

    // Listing owner loses their offered figure and gains the offerer's figure
    await db
      .delete(userCollectionProgress)
      .where(
        and(
          eq(userCollectionProgress.supabaseUserId, user.id),
          eq(userCollectionProgress.doflinId, listing.offeringDoflinId)
        )
      );

    // Offerer loses their offered figure
    await db
      .delete(userCollectionProgress)
      .where(
        and(
          eq(userCollectionProgress.supabaseUserId, offer.offererUserId),
          eq(userCollectionProgress.doflinId, offer.offeredDoflinId)
        )
      );

    // Listing owner gains offerer's figure
    await db.insert(userCollectionProgress).values({
      supabaseUserId: user.id,
      userEmail: "", // Will be updated by trigger or we can fetch
      doflinId: offer.offeredDoflinId,
      owned: true,
    }).onDuplicateKeyUpdate({
      set: { owned: true },
    });

    // Offerer gains listing owner's figure
    await db.insert(userCollectionProgress).values({
      supabaseUserId: offer.offererUserId,
      userEmail: "", // Will be updated by trigger or we can fetch
      doflinId: listing.offeringDoflinId,
      owned: true,
    }).onDuplicateKeyUpdate({
      set: { owned: true },
    });

    return NextResponse.json({ success: true, action: "accepted" });
  } catch (error) {
    console.error("Trade execution error:", error);
    return NextResponse.json(
      { error: "Error al procesar el intercambio" },
      { status: 500 }
    );
  }
}
