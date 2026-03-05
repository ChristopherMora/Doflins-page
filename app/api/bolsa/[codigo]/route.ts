import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
): Promise<NextResponse> {
  const { codigo } = await params;

  if (!codigo || !/^[A-Z0-9]{6,12}$/.test(codigo.toUpperCase())) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  try {
    const db = getDb();

    const [bag] = await db
      .select({
        id: codigosBolsa.id,
        codigo: codigosBolsa.codigo,
        packSize: codigosBolsa.packSize,
        status: codigosBolsa.status,
        scanCount: codigosBolsa.scanCount,
      })
      .from(codigosBolsa)
      .where(eq(codigosBolsa.codigo, codigo.toUpperCase()))
      .limit(1);

    if (!bag) {
      return NextResponse.json({ error: "Bolsa no encontrada" }, { status: 404 });
    }

    if (bag.status === "blocked") {
      return NextResponse.json({ error: "Bolsa bloqueada" }, { status: 410 });
    }

    const items = await db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        modeloBase: doflins.modeloBase,
        variante: doflins.variante,
        serie: doflins.serie,
        numeroColeccion: doflins.numeroColeccion,
        rareza: doflins.rareza,
        probabilidad: doflins.probabilidad,
        imagenUrl: doflins.imagenUrl,
        siluetaUrl: doflins.siluetaUrl,
        datoCurioso: doflins.datoCurioso,
      })
      .from(codigosBolsaItems)
      .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
      .where(eq(codigosBolsaItems.codigoBolsaId, bag.id))
      .orderBy(asc(codigosBolsaItems.posicion));

    // Registrar scan (sin bloquear la respuesta)
    void db
      .update(codigosBolsa)
      .set({
        scanCount: bag.scanCount + 1,
        lastScannedAt: new Date(),
        usado: true,
        fechaActivacion: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(codigosBolsa.id, bag.id))
      .catch(console.error);

    return NextResponse.json({
      bag: {
        codigo: bag.codigo,
        packSize: bag.packSize,
        totalItems: items.length,
      },
      doflins: items,
    });
  } catch (err) {
    console.error("[bolsa GET]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
