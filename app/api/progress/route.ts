import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { userCollectionProgress } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const progressUpdateSchema = z.object({
  doflinId: z.number().int().positive(),
  owned: z.boolean(),
});

function unauthorizedResponse(message = "Debes iniciar sesión para guardar tu progreso."): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      message,
    },
    { status: 401 },
  );
}

async function resolveAuthenticatedUser(
  request: NextRequest,
): Promise<{ id: string; email: string } | null> {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await resolveAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const rows = await getDb()
      .select({ doflinId: userCollectionProgress.doflinId })
      .from(userCollectionProgress)
      .where(
        and(
          eq(userCollectionProgress.supabaseUserId, user.id),
          eq(userCollectionProgress.owned, true),
        ),
      );

    return NextResponse.json(
      {
        status: "ok",
        ownedIds: rows.map((row) => row.doflinId),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "No se pudo cargar tu progreso.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await resolveAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  let payload: z.infer<typeof progressUpdateSchema>;
  try {
    const body = await request.json();
    payload = progressUpdateSchema.parse(body);
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Datos inválidos.",
      },
      { status: 400 },
    );
  }

  try {
    if (payload.owned) {
      await getDb()
        .insert(userCollectionProgress)
        .values({
          supabaseUserId: user.id,
          userEmail: user.email,
          doflinId: payload.doflinId,
          owned: true,
        })
        .onDuplicateKeyUpdate({
          set: {
            userEmail: user.email,
            owned: true,
            updatedAt: new Date(),
          },
        });
    } else {
      await getDb()
        .delete(userCollectionProgress)
        .where(
          and(
            eq(userCollectionProgress.supabaseUserId, user.id),
            eq(userCollectionProgress.doflinId, payload.doflinId),
          ),
        );
    }

    return NextResponse.json(
      {
        status: "ok",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "No se pudo guardar tu progreso.",
      },
      { status: 500 },
    );
  }
}
