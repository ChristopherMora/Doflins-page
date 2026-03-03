import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import { codigosBolsa } from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface BulkRow {
  codigo: string;
  doflinId: number;
  packSize: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: BulkRow[];
  try {
    const body = (await request.json()) as { rows?: unknown };
    if (!Array.isArray(body.rows)) throw new Error("rows must be array");
    rows = (body.rows as BulkRow[]).filter(
      (r) =>
        typeof r.codigo === "string" &&
        r.codigo.length > 0 &&
        typeof r.doflinId === "number" &&
        !isNaN(r.doflinId),
    );
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows" }, { status: 400 });
  }

  if (rows.length > 5000) {
    return NextResponse.json(
      { error: "Max 5000 rows per batch" },
      { status: 400 },
    );
  }

  const db = getDb();

  // Insert in chunks of 500 to avoid packet size limits
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map((r) => ({
      codigo: r.codigo.toUpperCase().slice(0, 12),
      doflinId: r.doflinId,
      packSize: r.packSize > 0 ? r.packSize : 1,
    }));
    await db.insert(codigosBolsa).ignore().values(chunk);
    inserted += chunk.length;
  }

  return NextResponse.json({ inserted });
}
