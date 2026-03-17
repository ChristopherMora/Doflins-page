import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { rewards, rewardRedemptions, userProfiles } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/auth-admin";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin(request: NextRequest): Promise<{ ok: true } | { ok: false }> {
  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return { ok: false };
  return { ok: true };
}

// GET /api/admin/rewards — listar recompensas + canjes pendientes
export async function GET(request: NextRequest): Promise<NextResponse> {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getDb();

  const [rewardsList, redemptionsList] = await Promise.all([
    db.select().from(rewards).orderBy(desc(rewards.createdAt)),
    db
      .select({
        id: rewardRedemptions.id,
        supabaseUserId: rewardRedemptions.supabaseUserId,
        rewardId: rewardRedemptions.rewardId,
        pointsSpent: rewardRedemptions.pointsSpent,
        status: rewardRedemptions.status,
        deliveryData: rewardRedemptions.deliveryData,
        createdAt: rewardRedemptions.createdAt,
        rewardTitle: rewards.title,
        displayName: userProfiles.displayName,
      })
      .from(rewardRedemptions)
      .leftJoin(rewards, eq(rewards.id, rewardRedemptions.rewardId))
      .leftJoin(userProfiles, eq(userProfiles.supabaseUserId, rewardRedemptions.supabaseUserId))
      .orderBy(desc(rewardRedemptions.createdAt))
      .limit(100),
  ]);

  return NextResponse.json({ rewards: rewardsList, redemptions: redemptionsList });
}

// POST /api/admin/rewards — crear recompensa
const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  pointsCost: z.number().int().positive(),
  type: z.enum(["discount_code", "physical", "digital", "custom"]).default("custom"),
  stock: z.number().int().positive().nullable().default(null),
  active: z.boolean().default(true),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { meta, imageUrl, ...rest } = body.data;

  await getDb().insert(rewards).values({
    ...rest,
    imageUrl: imageUrl || null,
    meta: meta ? JSON.stringify(meta) : null,
  });

  return NextResponse.json({ ok: true });
}

// PUT /api/admin/rewards — actualizar recompensa o estado de un canje
const updateRewardSchema = z.object({
  id: z.number().int().positive(),
  type: z.literal("reward"),
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  pointsCost: z.number().int().positive().optional(),
  stock: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const updateRedemptionSchema = z.object({
  id: z.number().int().positive(),
  type: z.literal("redemption"),
  status: z.enum(["pending", "processed", "cancelled"]),
  deliveryData: z.string().optional(),
});

const updateSchema = z.discriminatedUnion("type", [updateRewardSchema, updateRedemptionSchema]);

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  if (body.data.type === "reward") {
    const { id, type: _type, meta, imageUrl, ...rest } = body.data;
    await db.update(rewards).set({
      ...rest,
      imageUrl: imageUrl ?? undefined,
      meta: meta ? JSON.stringify(meta) : undefined,
      updatedAt: new Date(),
    }).where(eq(rewards.id, id));
  } else {
    const { id, type: _type, status, deliveryData } = body.data;
    await db.update(rewardRedemptions).set({
      status,
      deliveryData: deliveryData ?? undefined,
      updatedAt: new Date(),
    }).where(eq(rewardRedemptions.id, id));
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/rewards?id=X — desactivar recompensa (soft delete)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await getDb()
    .update(rewards)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(rewards.id, id));

  return NextResponse.json({ ok: true });
}
