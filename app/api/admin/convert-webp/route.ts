import { stat, unlink } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import { doflins } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONVERTIBLE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);
const WEBP_QUALITY = 82;

/**
 * POST /api/admin/convert-webp
 *
 * Converts all local doflin images (PNG/JPG) to WebP format.
 * Requires admin auth (token or session).
 *
 * Query params:
 *   ?dry=true  — preview what would be converted without making changes
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth ──
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin_convert:${ip}`, 3, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { status: "error", message: "Demasiados intentos." },
      { status: 429 },
    );
  }

  const token = request.headers.get("x-admin-token")?.trim() ?? "";
  const requiredToken = process.env.ADMIN_FORM_TOKEN?.trim();

  let authorized = false;
  if (requiredToken && token && token === requiredToken) {
    authorized = true;
  }

  if (!authorized) {
    try {
      const supabase = createSupabaseServerClientForRoute(request);
      const { data: { user } } = await supabase.auth.getUser();
      if (isAdminEmail(user?.email)) authorized = true;
    } catch {
      /* fall through */
    }
  }

  if (!authorized) {
    return NextResponse.json(
      { status: "error", message: "No autorizado." },
      { status: 401 },
    );
  }

  // ── Params ──
  const dryRun = request.nextUrl.searchParams.get("dry") === "true";

  // ── Convert ──
  const db = getDb();
  const rows = await db
    .select({
      id: doflins.id,
      nombre: doflins.nombre,
      imagenUrl: doflins.imagenUrl,
      siluetaUrl: doflins.siluetaUrl,
    })
    .from(doflins);

  const results: Array<{
    doflin: string;
    field: string;
    from: string;
    to: string;
    savedKB: number;
    status: "converted" | "skipped" | "error";
    reason?: string;
  }> = [];

  let totalSavedBytes = 0;

  for (const row of rows) {
    for (const field of ["imagenUrl", "siluetaUrl"] as const) {
      const urlPath = row[field];
      if (!urlPath?.startsWith("/uploads/doflins/")) {
        continue;
      }

      const ext = path.extname(urlPath).replace(".", "").toLowerCase();
      if (!CONVERTIBLE_EXTENSIONS.has(ext)) {
        results.push({
          doflin: row.nombre,
          field,
          from: urlPath,
          to: urlPath,
          savedKB: 0,
          status: "skipped",
          reason: `Already ${ext}`,
        });
        continue;
      }

      const absolutePath = path.join(process.cwd(), "public", urlPath);
      const webpUrl = urlPath.replace(/\.(png|jpe?g)$/i, ".webp");
      const webpAbsolute = path.join(process.cwd(), "public", webpUrl);

      try {
        const originalStat = await stat(absolutePath).catch(() => null);
        if (!originalStat) {
          results.push({
            doflin: row.nombre,
            field,
            from: urlPath,
            to: urlPath,
            savedKB: 0,
            status: "skipped",
            reason: "File not found on disk",
          });
          continue;
        }

        if (dryRun) {
          results.push({
            doflin: row.nombre,
            field,
            from: urlPath,
            to: webpUrl,
            savedKB: 0,
            status: "converted",
            reason: `Would convert (${(originalStat.size / 1024).toFixed(1)}KB)`,
          });
          continue;
        }

        // Convert
        await sharp(absolutePath).webp({ quality: WEBP_QUALITY }).toFile(webpAbsolute);
        const newStat = await stat(webpAbsolute);
        const saved = originalStat.size - newStat.size;
        totalSavedBytes += Math.max(saved, 0);

        // Update DB
        await db
          .update(doflins)
          .set({ [field === "imagenUrl" ? "imagenUrl" : "siluetaUrl"]: webpUrl })
          .where(eq(doflins.id, row.id));

        // Remove original
        await unlink(absolutePath);

        results.push({
          doflin: row.nombre,
          field,
          from: urlPath,
          to: webpUrl,
          savedKB: Math.round(saved / 1024),
          status: "converted",
        });
      } catch (err) {
        results.push({
          doflin: row.nombre,
          field,
          from: urlPath,
          to: webpUrl,
          savedKB: 0,
          status: "error",
          reason: (err as Error).message,
        });
      }
    }
  }

  const converted = results.filter((r) => r.status === "converted").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    status: "ok",
    dryRun,
    summary: {
      totalDoflins: rows.length,
      converted,
      skipped,
      errors,
      savedMB: (totalSavedBytes / 1024 / 1024).toFixed(2),
    },
    results,
  });
}
