import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { figureWantList, doflins, userProfiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - Get public want list for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const db = getDb();

  // Get user profile for display name
  const [profile] = await db
    .select({
      displayName: userProfiles.displayName,
    })
    .from(userProfiles)
    .where(eq(userProfiles.supabaseUserId, userId))
    .limit(1);

  // Get public want list items
  const items = await db
    .select({
      id: figureWantList.id,
      doflinId: figureWantList.doflinId,
      priority: figureWantList.priority,
      notes: figureWantList.notes,
      createdAt: figureWantList.createdAt,
      doflin: {
        id: doflins.id,
        nombre: doflins.nombre,
        imagenUrl: doflins.imagenUrl,
        rareza: doflins.rareza,
        serie: doflins.serie,
        siluetaUrl: doflins.siluetaUrl,
      },
    })
    .from(figureWantList)
    .innerJoin(doflins, eq(figureWantList.doflinId, doflins.id))
    .where(and(
      eq(figureWantList.supabaseUserId, userId),
      eq(figureWantList.isPublic, true)
    ))
    .orderBy(desc(figureWantList.createdAt));

  return NextResponse.json({
    userId,
    displayName: profile?.displayName || "Coleccionista",
    items,
    count: items.length,
  });
}
