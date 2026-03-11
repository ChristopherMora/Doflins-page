import { randomBytes } from "node:crypto";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins } from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateBagCode(): string {
  // 6 bytes → 8 hex chars, uppercase
  return randomBytes(6).toString("hex").toUpperCase();
}

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

// ─── GET /api/admin/bolsas — lista todas las bolsas ─────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = getDb();

    const bags = await db
      .select({
        id: codigosBolsa.id,
        codigo: codigosBolsa.codigo,
        packSize: codigosBolsa.packSize,
        usado: codigosBolsa.usado,
        scanCount: codigosBolsa.scanCount,
        status: codigosBolsa.status,
        fechaActivacion: codigosBolsa.fechaActivacion,
        lastScannedAt: codigosBolsa.lastScannedAt,
        createdAt: codigosBolsa.createdAt,
      })
      .from(codigosBolsa)
      .orderBy(desc(codigosBolsa.createdAt))
      .limit(200);

    // Para cada bolsa, obtener sus items
    const bagIds = bags.map((b) => b.id);
    const itemsByBag: Record<number, { id: number; nombre: string; rareza: string; imagenUrl: string }[]> = {};

    if (bagIds.length > 0) {
      const items = await db
        .select({
          codigoBolsaId: codigosBolsaItems.codigoBolsaId,
          posicion: codigosBolsaItems.posicion,
          id: doflins.id,
          nombre: doflins.nombre,
          rareza: doflins.rareza,
          imagenUrl: doflins.imagenUrl,
        })
        .from(codigosBolsaItems)
        .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
        .where(inArray(codigosBolsaItems.codigoBolsaId, bagIds))
        .orderBy(asc(codigosBolsaItems.posicion));

      for (const item of items) {
        if (!itemsByBag[item.codigoBolsaId]) itemsByBag[item.codigoBolsaId] = [];
        itemsByBag[item.codigoBolsaId]!.push({
          id: item.id,
          nombre: item.nombre,
          rareza: item.rareza,
          imagenUrl: item.imagenUrl,
        });
      }
    }

    return NextResponse.json({
      bags: bags.map((b) => ({
        ...b,
        items: itemsByBag[b.id] ?? [],
      })),
    });
  } catch (err) {
    console.error("[admin/bolsas GET]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── POST /api/admin/bolsas — crear nueva bolsa ──────────────────────────────
const createBagSchema = z.object({
  doflinIds: z.array(z.number().int().positive()).min(1).max(50),
  packSize: z.number().int().positive().default(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = createBagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { doflinIds, packSize } = parsed.data;

  try {
    const db = getDb();

    // Verificar que todos los doflinIds existen
    const existingDoflins = await db
      .select({ id: doflins.id })
      .from(doflins)
      .where(inArray(doflins.id, doflinIds));

    if (existingDoflins.length !== doflinIds.length) {
      return NextResponse.json(
        { error: "Uno o más doflins no existen" },
        { status: 400 },
      );
    }

    // Generar código único con retry
    let codigo = generateBagCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await db
        .select({ id: codigosBolsa.id })
        .from(codigosBolsa)
        .where(eq(codigosBolsa.codigo, codigo))
        .limit(1);

      if (existing.length === 0) break;
      codigo = generateBagCode();
    }

    // Crear la bolsa y sus items en transacción
    const result = await db.transaction(async (tx) => {
      const [insertResult] = await tx.insert(codigosBolsa).values({
        codigo,
        packSize,
        doflinId: doflinIds[0]!, // primer doflin como referencia principal
        usado: false,
        scanCount: 0,
        status: "active",
      });

      const newBagId = insertResult.insertId;

      await tx.insert(codigosBolsaItems).values(
        doflinIds.map((id, index) => ({
          codigoBolsaId: newBagId,
          doflinId: id,
          posicion: index,
        })),
      );

      return { id: newBagId, codigo };
    });

    return NextResponse.json(
      {
        success: true,
        bag: { id: result.id, codigo: result.codigo, packSize, doflinCount: doflinIds.length },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[admin/bolsas POST]", err);
    return NextResponse.json({ error: "Error al crear la bolsa" }, { status: 500 });
  }
}
