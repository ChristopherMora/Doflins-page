import { and, desc, eq, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import {
  doflins,
  tradeListings,
  userCollectionProgress,
} from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ListingWithDoflin {
  id: number;
  supabaseUserId: string;
  offeringDoflinId: number;
  offeringNombre: string;
  offeringImagenUrl: string;
  offeringRareza: string;
  wantingDoflinId: number | null;
  wantingNombre: string | null;
  wantingImagenUrl: string | null;
  wantingRareza: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
}

// GET: fetch open trade listings (marketplace)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const wantsId = searchParams.get("wants"); // Filter by what they want
  const offersId = searchParams.get("offers"); // Filter by what they offer

  const db = getDb();

  // Build query with aliases for both doflins
  const whereConditions = [eq(tradeListings.status, "open")];

  if (wantsId) {
    const wantingDoflinId = parseInt(wantsId, 10);
    if (!isNaN(wantingDoflinId)) {
      whereConditions.push(
        or(
          eq(tradeListings.wantingDoflinId, wantingDoflinId),
          isNull(tradeListings.wantingDoflinId) // Open to any offer
        )!
      );
    }
  }

  if (offersId) {
    const offeringDoflinId = parseInt(offersId, 10);
    if (!isNaN(offeringDoflinId)) {
      whereConditions.push(eq(tradeListings.offeringDoflinId, offeringDoflinId));
    }
  }

  // We need to do two separate queries for the doflin names
  const listings = await db
    .select({
      id: tradeListings.id,
      supabaseUserId: tradeListings.supabaseUserId,
      offeringDoflinId: tradeListings.offeringDoflinId,
      wantingDoflinId: tradeListings.wantingDoflinId,
      wantingRarity: tradeListings.wantingRarity,
      notes: tradeListings.notes,
      status: tradeListings.status,
      createdAt: tradeListings.createdAt,
    })
    .from(tradeListings)
    .where(and(...whereConditions))
    .orderBy(desc(tradeListings.createdAt))
    .limit(50);

  // Fetch doflin info for all unique IDs
  const offeringIds = listings.map((l) => l.offeringDoflinId);
  const wantingIds = listings.map((l) => l.wantingDoflinId).filter((id): id is number => id !== null);
  const allIds = [...new Set([...offeringIds, ...wantingIds])];

  const doflinRows = allIds.length > 0
    ? await db
        .select({
          id: doflins.id,
          nombre: doflins.nombre,
          imagenUrl: doflins.imagenUrl,
          rareza: doflins.rareza,
        })
        .from(doflins)
        .where(or(...allIds.map((id) => eq(doflins.id, id)))!)
    : [];

  const doflinMap = new Map(doflinRows.map((d) => [d.id, d]));

  const listingsWithDoflins: ListingWithDoflin[] = listings.map((l) => {
    const offering = doflinMap.get(l.offeringDoflinId);
    const wanting = l.wantingDoflinId ? doflinMap.get(l.wantingDoflinId) : null;

    return {
      id: l.id,
      supabaseUserId: l.supabaseUserId,
      offeringDoflinId: l.offeringDoflinId,
      offeringNombre: offering?.nombre ?? "Desconocido",
      offeringImagenUrl: offering?.imagenUrl ?? "/images/placeholders/doflin.webp",
      offeringRareza: offering?.rareza ?? "COMMON",
      wantingDoflinId: l.wantingDoflinId,
      wantingNombre: wanting?.nombre ?? null,
      wantingImagenUrl: wanting?.imagenUrl ?? null,
      wantingRareza: wanting?.rareza ?? l.wantingRarity ?? null,
      notes: l.notes,
      status: l.status,
      createdAt: l.createdAt,
    };
  });

  return NextResponse.json({ listings: listingsWithDoflins });
}

interface CreateListingBody {
  offeringDoflinId: number;
  wantingDoflinId?: number | null;
  wantingRarity?: string;
  notes?: string;
}

// POST: create a new trade listing
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`trades_post:${ip}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes, intenta en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: CreateListingBody;
  try {
    body = (await request.json()) as CreateListingBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.offeringDoflinId || typeof body.offeringDoflinId !== "number") {
    return NextResponse.json(
      { error: "Debes especificar una figura para ofrecer" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Verify user owns the doflin they're offering
  const [owned] = await db
    .select({ id: userCollectionProgress.id })
    .from(userCollectionProgress)
    .where(
      and(
        eq(userCollectionProgress.supabaseUserId, user.id),
        eq(userCollectionProgress.doflinId, body.offeringDoflinId),
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

  // Check if user already has an active listing for this doflin
  const [existing] = await db
    .select({ id: tradeListings.id })
    .from(tradeListings)
    .where(
      and(
        eq(tradeListings.supabaseUserId, user.id),
        eq(tradeListings.offeringDoflinId, body.offeringDoflinId),
        eq(tradeListings.status, "open")
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Ya tienes un intercambio activo para esta figura" },
      { status: 400 }
    );
  }

  // Create the listing
  const result = await db.insert(tradeListings).values({
    supabaseUserId: user.id,
    offeringDoflinId: body.offeringDoflinId,
    wantingDoflinId: body.wantingDoflinId ?? null,
    wantingRarity: body.wantingRarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "ULTRA" | "MYTHIC" | undefined,
    notes: body.notes ?? null,
  });

  return NextResponse.json({ success: true, listingId: result[0].insertId });
}
