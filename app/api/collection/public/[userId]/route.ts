import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { doflins, userCollectionProgress } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  const { userId } = await params;

  if (!userId || userId.length > 64) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const db = getDb();

  const [allDoflins, ownedRows] = await Promise.all([
    db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        rareza: doflins.rareza,
        imagenUrl: doflins.imagenUrl,
        siluetaUrl: doflins.siluetaUrl,
        serie: doflins.serie,
        numeroColeccion: doflins.numeroColeccion,
      })
      .from(doflins)
      .where(eq(doflins.activo, true)),

    db
      .select({
        doflinId: userCollectionProgress.doflinId,
        userEmail: userCollectionProgress.userEmail,
      })
      .from(userCollectionProgress)
      .where(eq(userCollectionProgress.supabaseUserId, userId)),
  ]);

  if (ownedRows.length === 0) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const ownedIds = ownedRows.map((r) => r.doflinId);
  // Redact full email to protect privacy
  const rawEmail = ownedRows[0]?.userEmail ?? "";
  const [user, domain] = rawEmail.split("@");
  const maskedEmail = user
    ? `${user.slice(0, 2)}${"*".repeat(Math.max(0, user.length - 2))}@${domain ?? ""}`
    : "";

  return NextResponse.json({
    maskedEmail,
    doflins: allDoflins,
    ownedIds,
  });
}
