import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { figureWantList, doflins } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get current user's want list
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = getDb();

  const items = await db
    .select({
      id: figureWantList.id,
      doflinId: figureWantList.doflinId,
      priority: figureWantList.priority,
      notes: figureWantList.notes,
      isPublic: figureWantList.isPublic,
      createdAt: figureWantList.createdAt,
      doflin: {
        id: doflins.id,
        nombre: doflins.nombre,
        imagenUrl: doflins.imagenUrl,
        rareza: doflins.rareza,
        serie: doflins.serie,
      },
    })
    .from(figureWantList)
    .innerJoin(doflins, eq(figureWantList.doflinId, doflins.id))
    .where(eq(figureWantList.supabaseUserId, user.id))
    .orderBy(desc(figureWantList.createdAt));

  return NextResponse.json({ items });
}

// POST - Add figure to want list
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`wantlist_write:${ip}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { doflinId, priority = "medium", notes = null, isPublic = true } = body;

    if (!doflinId || typeof doflinId !== "number") {
      return NextResponse.json({ error: "doflinId requerido" }, { status: 400 });
    }

    const db = getDb();

    // Check if already in want list
    const [existing] = await db
      .select()
      .from(figureWantList)
      .where(and(
        eq(figureWantList.supabaseUserId, user.id),
        eq(figureWantList.doflinId, doflinId)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Ya está en tu lista" }, { status: 400 });
    }

    // Verify doflin exists
    const [doflin] = await db
      .select()
      .from(doflins)
      .where(eq(doflins.id, doflinId))
      .limit(1);

    if (!doflin) {
      return NextResponse.json({ error: "Figura no encontrada" }, { status: 404 });
    }

    await db.insert(figureWantList).values({
      supabaseUserId: user.id,
      doflinId,
      priority,
      notes: notes?.slice(0, 200) || null,
      isPublic,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[want-list POST]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Remove figure from want list
export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`wantlist_write:${ip}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const doflinId = parseInt(searchParams.get("doflinId") || "", 10);

    if (!doflinId) {
      return NextResponse.json({ error: "doflinId requerido" }, { status: 400 });
    }

    const db = getDb();

    await db
      .delete(figureWantList)
      .where(and(
        eq(figureWantList.supabaseUserId, user.id),
        eq(figureWantList.doflinId, doflinId)
      ));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[want-list DELETE]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH - Update want list item
export async function PATCH(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`wantlist_write:${ip}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { doflinId, priority, notes, isPublic } = body;

    if (!doflinId || typeof doflinId !== "number") {
      return NextResponse.json({ error: "doflinId requerido" }, { status: 400 });
    }

    const db = getDb();

    const updates: Record<string, unknown> = {};
    if (priority !== undefined) updates.priority = priority;
    if (notes !== undefined) updates.notes = notes?.slice(0, 200) || null;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    await db
      .update(figureWantList)
      .set(updates)
      .where(and(
        eq(figureWantList.supabaseUserId, user.id),
        eq(figureWantList.doflinId, doflinId)
      ));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[want-list PATCH]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
