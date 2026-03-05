import { asc, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import {
  codigosBolsa,
  codigosBolsaItems,
  doflins,
  scanEvents,
  userCollectionProgress,
} from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(
  request: NextRequest,
): Promise<{ id: string; email: string } | NextResponse> {
  const supabase = await createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return { id: user.id, email: user.email };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id: rawId } = await params;
  const bagId = parseInt(rawId, 10);
  if (isNaN(bagId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = getDb();

  // 1. Bolsa base
  const [bag] = await db
    .select()
    .from(codigosBolsa)
    .where(eq(codigosBolsa.id, bagId))
    .limit(1);

  if (!bag) {
    return NextResponse.json({ error: "Bolsa no encontrada" }, { status: 404 });
  }

  // 2. Items de la bolsa con doflin info
  const items = await db
    .select({
      doflinId: codigosBolsaItems.doflinId,
      posicion: codigosBolsaItems.posicion,
      nombre: doflins.nombre,
      rareza: doflins.rareza,
      imagenUrl: doflins.imagenUrl,
    })
    .from(codigosBolsaItems)
    .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
    .where(eq(codigosBolsaItems.codigoBolsaId, bagId))
    .orderBy(asc(codigosBolsaItems.posicion));

  const doflinIds = items.map((i) => i.doflinId);

  // 3. Historial de escaneos (últimos 30)
  const scans = await db
    .select({
      id: scanEvents.id,
      eventType: scanEvents.eventType,
      ipHash: scanEvents.ipHash,
      userAgent: scanEvents.userAgent,
      createdAt: scanEvents.createdAt,
    })
    .from(scanEvents)
    .where(eq(scanEvents.codigoBolsaId, bagId))
    .orderBy(desc(scanEvents.createdAt))
    .limit(30);

  // 4. Usuarios que registraron alguno de estos doflins
  let usersProgress: {
    supabaseUserId: string;
    userEmail: string;
    doflinId: number;
    owned: boolean;
    updatedAt: Date;
  }[] = [];

  if (doflinIds.length > 0) {
    usersProgress = await db
      .select({
        supabaseUserId: userCollectionProgress.supabaseUserId,
        userEmail: userCollectionProgress.userEmail,
        doflinId: userCollectionProgress.doflinId,
        owned: userCollectionProgress.owned,
        updatedAt: userCollectionProgress.updatedAt,
      })
      .from(userCollectionProgress)
      .where(
        inArray(userCollectionProgress.doflinId, doflinIds),
      );
  }

  // Agrupar por usuario
  const userMap = new Map<
    string,
    {
      email: string;
      doflinIds: number[];
      lastActivity: Date;
    }
  >();

  for (const row of usersProgress) {
    if (!row.owned) continue;
    const existing = userMap.get(row.supabaseUserId);
    if (existing) {
      existing.doflinIds.push(row.doflinId);
      if (row.updatedAt > existing.lastActivity) {
        existing.lastActivity = row.updatedAt;
      }
    } else {
      userMap.set(row.supabaseUserId, {
        email: row.userEmail,
        doflinIds: [row.doflinId],
        lastActivity: row.updatedAt,
      });
    }
  }

  const usuarios = Array.from(userMap.entries())
    .map(([userId, data]) => ({
      userId,
      email: data.email,
      doflinIdsRegistrados: data.doflinIds,
      totalRegistrados: data.doflinIds.length,
      totalBolsa: doflinIds.length,
      porcentaje:
        doflinIds.length > 0
          ? Math.round((data.doflinIds.length / doflinIds.length) * 100)
          : 0,
      lastActivity: data.lastActivity,
    }))
    .sort((a, b) => b.totalRegistrados - a.totalRegistrados);

  // 5. Stats de scans por tipo
  const scansByType: Record<string, number> = {};
  for (const s of scans) {
    scansByType[s.eventType] = (scansByType[s.eventType] ?? 0) + 1;
  }

  return NextResponse.json({
    bag: {
      ...bag,
      items,
    },
    scans: scans.map((s) => ({
      id: s.id,
      eventType: s.eventType,
      ipHash: s.ipHash,
      device: parseDevice(s.userAgent),
      createdAt: s.createdAt,
    })),
    scansByType,
    usuarios,
  });
}

function parseDevice(ua: string): string {
  if (!ua) return "Desconocido";
  const u = ua.toLowerCase();
  if (u.includes("iphone") || u.includes("ipad")) return "iPhone/iPad";
  if (u.includes("android")) return "Android";
  if (u.includes("windows")) return "Windows";
  if (u.includes("mac")) return "Mac";
  if (u.includes("linux")) return "Linux";
  return "Otro";
}
