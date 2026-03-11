import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { wishlistItems } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  productId: z.string().min(1).max(128),
});

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "No autenticado" }, { status: 401 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) return NextResponse.json({ productIds: [] });

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const rows = await getDb()
    .select({ shopifyProductId: wishlistItems.shopifyProductId })
    .from(wishlistItems)
    .where(eq(wishlistItems.supabaseUserId, user.id));

  return NextResponse.json({ productIds: rows.map((r) => r.shopifyProductId) });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) return NextResponse.json({ ok: false });

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = toggleSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "productId inválido" }, { status: 400 });

  await getDb()
    .insert(wishlistItems)
    .values({ supabaseUserId: user.id, shopifyProductId: body.data.productId })
    .onDuplicateKeyUpdate({ set: { shopifyProductId: body.data.productId } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) return NextResponse.json({ ok: false });

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId requerido" }, { status: 400 });

  await getDb()
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.supabaseUserId, user.id),
        eq(wishlistItems.shopifyProductId, productId),
      ),
    );

  return NextResponse.json({ ok: true });
}
