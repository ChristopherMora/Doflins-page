import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { RARITY_ORDER } from "@/lib/constants/rarity";
import { getDb } from "@/lib/db/client";
import { doflins } from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";
import type { Rarity } from "@/lib/types/doflin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SILHOUETTE_URL = "/images/placeholders/doflin-placeholder.svg";
const ALLOWED_SERIES = new Set(["Animals", "Multiverse"]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const DOFLIN_SELECT = {
  id: doflins.id,
  name: doflins.nombre,
  baseModel: doflins.modeloBase,
  variantName: doflins.variante,
  slug: doflins.slug,
  series: doflins.serie,
  collectionNumber: doflins.numeroColeccion,
  rarity: doflins.rareza,
  probability: doflins.probabilidad,
  imageUrl: doflins.imagenUrl,
  silhouetteUrl: doflins.siluetaUrl,
  active: doflins.activo,
  createdAt: doflins.createdAt,
  updatedAt: doflins.updatedAt,
} as const;

type AdminActionError = {
  code?: string;
  errno?: number;
  message?: string;
  sqlMessage?: string;
  cause?: unknown;
};

interface AdminDoflinRow {
  id: number;
  name: string;
  baseModel: string;
  variantName: string;
  slug: string;
  series: string;
  collectionNumber: number;
  rarity: Rarity;
  probability: number;
  imageUrl: string;
  silhouetteUrl: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      message,
    },
    { status },
  );
}

function extractSqlErrorInfo(error: unknown): {
  code?: string;
  errno?: number;
  message: string;
} {
  const visited = new Set<unknown>();
  let current: unknown = error;
  let fallbackMessage = "Unknown error";

  for (let depth = 0; depth < 8 && current && !visited.has(current); depth += 1) {
    visited.add(current);

    if (typeof current === "object") {
      const candidate = current as AdminActionError;

      if (typeof candidate.message === "string" && candidate.message.trim()) {
        fallbackMessage = candidate.message;
      }

      const code = typeof candidate.code === "string" ? candidate.code : undefined;
      const errno = typeof candidate.errno === "number" ? candidate.errno : undefined;
      const sqlMessage =
        typeof candidate.sqlMessage === "string" && candidate.sqlMessage.trim()
          ? candidate.sqlMessage
          : undefined;

      if (code || errno || sqlMessage) {
        return {
          code,
          errno,
          message: sqlMessage ?? fallbackMessage,
        };
      }

      if ("cause" in candidate) {
        current = candidate.cause;
        continue;
      }
    }

    break;
  }

  return { message: fallbackMessage };
}

function toSlug(rawValue: string): string {
  const normalized = rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `doflin-${randomUUID().slice(0, 8)}`;
}

function getSafeExtension(file: File): string | null {
  const fileNameExtension = path.extname(file.name).replace(".", "").toLowerCase();

  if (ALLOWED_EXTENSIONS.has(fileNameExtension)) {
    return fileNameExtension;
  }

  const mime = file.type.toLowerCase();

  if (mime.includes("png")) {
    return "png";
  }

  if (mime.includes("jpeg") || mime.includes("jpg")) {
    return "jpg";
  }

  if (mime.includes("webp")) {
    return "webp";
  }

  if (mime.includes("svg")) {
    return "svg";
  }

  return null;
}

async function saveUploadedImage(file: File): Promise<string> {
  if (file.size <= 0) {
    throw new Error("Archivo vacío.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La imagen excede el límite de 8MB.");
  }

  const extension = getSafeExtension(file);
  if (!extension) {
    throw new Error("Formato de imagen no soportado. Usa PNG, JPG, WEBP o SVG.");
  }

  const folderPath = path.join(process.cwd(), "public", "uploads", "doflins");
  await mkdir(folderPath, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const outputPath = path.join(folderPath, fileName);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));

  return `/uploads/doflins/${fileName}`;
}

function normalizeToken(rawValue: string | null | undefined): string {
  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("Bearer ")) {
    return rawValue.slice(7).trim();
  }

  return rawValue.trim();
}

async function validateAdminAccess(
  request: NextRequest,
  tokenFromBody?: string,
): Promise<NextResponse | null> {
  const requiredToken = process.env.ADMIN_FORM_TOKEN?.trim();
  const providedToken =
    normalizeToken(request.headers.get("x-admin-token")) ||
    normalizeToken(request.headers.get("authorization")) ||
    normalizeToken(tokenFromBody);

  if (requiredToken && providedToken && providedToken === requiredToken) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClientForRoute(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isAdminEmail(user?.email)) {
      return null;
    }
  } catch {
    // fallback to unauthorized response below
  }

  if (requiredToken) {
    return errorResponse(
      "No autorizado. Inicia sesión con Google admin o usa token de administrador válido.",
      401,
    );
  }

  return errorResponse("No autorizado. Inicia sesión con Google admin.", 401);
}

function parseIdFromRequest(request: NextRequest): number | null {
  const rawValue = request.nextUrl.searchParams.get("id");
  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalPositiveInt(rawValue: FormDataEntryValue | null): number | null {
  if (rawValue === null) {
    return null;
  }

  const parsed = Number.parseInt(String(rawValue), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalProbability(rawValue: FormDataEntryValue | null): number | null {
  if (rawValue === null) {
    return null;
  }

  const parsed = Number(String(rawValue));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  return Math.round(parsed);
}

function parseOptionalBoolean(rawValue: FormDataEntryValue | null): boolean | null {
  if (rawValue === null) {
    return null;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function parseOptionalRarity(rawValue: FormDataEntryValue | null): Rarity | null {
  if (rawValue === null) {
    return null;
  }

  const rarity = String(rawValue).trim().toUpperCase() as Rarity;
  return RARITY_ORDER.includes(rarity) ? rarity : null;
}

function parseOptionalSeries(rawValue: FormDataEntryValue | null): "Animals" | "Multiverse" | null {
  if (rawValue === null) {
    return null;
  }

  const series = String(rawValue).trim();
  if (!ALLOWED_SERIES.has(series)) {
    return null;
  }

  return series as "Animals" | "Multiverse";
}

function normalizeVariantName(rawValue: string): string {
  const trimmed = rawValue.trim();
  return trimmed || "Original";
}

async function resolveUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  const db = getDb();
  let suffix = 0;
  let candidate = baseSlug;

  while (true) {
    const whereClause = excludeId
      ? and(eq(doflins.slug, candidate), ne(doflins.id, excludeId))
      : eq(doflins.slug, candidate);

    const [existing] = await db
      .select({ id: doflins.id })
      .from(doflins)
      .where(whereClause)
      .limit(1);

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

async function fetchDoflinById(id: number): Promise<AdminDoflinRow | null> {
  const db = getDb();
  const [row] = await db.select(DOFLIN_SELECT).from(doflins).where(eq(doflins.id, id)).limit(1);
  return row ?? null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tokenError = await validateAdminAccess(request);
  if (tokenError) {
    return tokenError;
  }

  try {
    const db = getDb();
    const rows = await db.select(DOFLIN_SELECT).from(doflins).orderBy(doflins.serie, doflins.numeroColeccion, doflins.id);

    return NextResponse.json(
      {
        status: "ok",
        items: rows,
      },
      { status: 200 },
    );
  } catch {
    return errorResponse("No se pudo cargar el catálogo admin.", 500);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const tokenError = await validateAdminAccess(request, String(formData.get("token") || ""));
    if (tokenError) {
      return tokenError;
    }

    const name = String(formData.get("name") || "").trim();
    const baseModelInput = String(formData.get("baseModel") || "").trim();
    const variantNameInput = String(formData.get("variantName") || "").trim();
    const series = parseOptionalSeries(formData.get("series"));
    const collectionNumber = parseOptionalPositiveInt(formData.get("collectionNumber"));
    const rarity = parseOptionalRarity(formData.get("rarity"));
    const probability = parseOptionalProbability(formData.get("probability"));
    const active = parseOptionalBoolean(formData.get("active"));

    const customSlug = String(formData.get("slug") || "").trim();
    const imageUrlFromInput = String(formData.get("imageUrl") || "").trim();
    const silhouetteUrlFromInput = String(formData.get("silhouetteUrl") || "").trim();
    const imageFile = formData.get("imageFile");
    const silhouetteFile = formData.get("silhouetteFile");

    if (name.length < 2) {
      return errorResponse("El nombre debe tener al menos 2 caracteres.");
    }

    if (!series) {
      return errorResponse("Serie inválida. Debe ser Animals o Multiverse.");
    }

    if (!collectionNumber) {
      return errorResponse("El número de colección debe ser un entero positivo.");
    }

    if (!rarity) {
      return errorResponse("Rareza inválida.");
    }

    if (probability === null) {
      return errorResponse("La probabilidad debe estar entre 0 y 100.");
    }

    const db = getDb();

    const [existingCollectionNumber] = await db
      .select({ id: doflins.id })
      .from(doflins)
      .where(and(eq(doflins.serie, series), eq(doflins.numeroColeccion, collectionNumber)))
      .limit(1);

    if (existingCollectionNumber) {
      return errorResponse(`Ya existe un Doflin en ${series} con número #${collectionNumber}.`, 409);
    }

    let imageUrl = imageUrlFromInput;
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await saveUploadedImage(imageFile);
    }

    if (!imageUrl) {
      return errorResponse("Debes subir una imagen del Doflin.");
    }

    let silhouetteUrl = silhouetteUrlFromInput;
    if (silhouetteFile instanceof File && silhouetteFile.size > 0) {
      silhouetteUrl = await saveUploadedImage(silhouetteFile);
    }

    if (!silhouetteUrl) {
      silhouetteUrl = DEFAULT_SILHOUETTE_URL;
    }

    const baseModel = baseModelInput || name;
    const variantName = normalizeVariantName(variantNameInput);

    const baseSlug = toSlug(customSlug || name);
    const slug = await resolveUniqueSlug(baseSlug);

    await db.insert(doflins).values({
      nombre: name,
      modeloBase: baseModel,
      variante: variantName,
      slug,
      serie: series,
      numeroColeccion: collectionNumber,
      rareza: rarity,
      probabilidad: probability,
      imagenUrl: imageUrl,
      siluetaUrl: silhouetteUrl,
      activo: active ?? true,
    });

    const [created] = await db.select(DOFLIN_SELECT).from(doflins).where(eq(doflins.slug, slug)).limit(1);

    return NextResponse.json(
      {
        status: "ok",
        item: created,
        message: "Doflin creado correctamente.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al crear el Doflin.";
    return errorResponse(message, 500);
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const id = parseIdFromRequest(request);
    if (!id) {
      return errorResponse("Falta un id válido en query (?id=).", 400);
    }

    const formData = await request.formData();
    const tokenError = await validateAdminAccess(request, String(formData.get("token") || ""));
    if (tokenError) {
      return tokenError;
    }

    const existing = await fetchDoflinById(id);
    if (!existing) {
      return errorResponse("Doflin no encontrado.", 404);
    }

    const hasName = formData.has("name");
    const hasBaseModel = formData.has("baseModel");
    const hasVariantName = formData.has("variantName");
    const hasSeries = formData.has("series");
    const hasCollectionNumber = formData.has("collectionNumber");
    const hasRarity = formData.has("rarity");
    const hasProbability = formData.has("probability");
    const hasActive = formData.has("active");
    const hasSlug = formData.has("slug");
    const hasImageUrl = formData.has("imageUrl");
    const hasSilhouetteUrl = formData.has("silhouetteUrl");

    const nextName = hasName ? String(formData.get("name") || "").trim() : existing.name;
    if (nextName.length < 2) {
      return errorResponse("El nombre debe tener al menos 2 caracteres.");
    }

    const parsedSeries = hasSeries ? parseOptionalSeries(formData.get("series")) : existing.series;
    if (!parsedSeries) {
      return errorResponse("Serie inválida. Debe ser Animals o Multiverse.");
    }

    const parsedCollectionNumber = hasCollectionNumber
      ? parseOptionalPositiveInt(formData.get("collectionNumber"))
      : existing.collectionNumber;
    if (!parsedCollectionNumber) {
      return errorResponse("El número de colección debe ser un entero positivo.");
    }

    const parsedRarity = hasRarity ? parseOptionalRarity(formData.get("rarity")) : existing.rarity;
    if (!parsedRarity) {
      return errorResponse("Rareza inválida.");
    }

    const parsedProbability = hasProbability
      ? parseOptionalProbability(formData.get("probability"))
      : existing.probability;
    if (parsedProbability === null) {
      return errorResponse("La probabilidad debe estar entre 0 y 100.");
    }

    const parsedActive = hasActive ? parseOptionalBoolean(formData.get("active")) : existing.active;
    if (parsedActive === null) {
      return errorResponse("Valor de estado activo inválido.");
    }

    const [duplicate] = await getDb()
      .select({ id: doflins.id })
      .from(doflins)
      .where(
        and(
          eq(doflins.serie, parsedSeries),
          eq(doflins.numeroColeccion, parsedCollectionNumber),
          ne(doflins.id, id),
        ),
      )
      .limit(1);

    if (duplicate) {
      return errorResponse(
        `Ya existe otro Doflin en ${parsedSeries} con número #${parsedCollectionNumber}.`,
        409,
      );
    }

    let imageUrl = existing.imageUrl;
    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await saveUploadedImage(imageFile);
    } else if (hasImageUrl) {
      const imageUrlInput = String(formData.get("imageUrl") || "").trim();
      if (imageUrlInput) {
        imageUrl = imageUrlInput;
      }
    }

    let silhouetteUrl = existing.silhouetteUrl;
    const silhouetteFile = formData.get("silhouetteFile");
    if (silhouetteFile instanceof File && silhouetteFile.size > 0) {
      silhouetteUrl = await saveUploadedImage(silhouetteFile);
    } else if (hasSilhouetteUrl) {
      const silhouetteUrlInput = String(formData.get("silhouetteUrl") || "").trim();
      if (silhouetteUrlInput) {
        silhouetteUrl = silhouetteUrlInput;
      }
    }

    const baseModelInput = hasBaseModel ? String(formData.get("baseModel") || "").trim() : existing.baseModel;
    const variantNameInput = hasVariantName
      ? String(formData.get("variantName") || "").trim()
      : existing.variantName;

    const finalBaseModel = baseModelInput || nextName;
    const finalVariantName = normalizeVariantName(variantNameInput);

    const slugInput = hasSlug ? String(formData.get("slug") || "").trim() : "";
    let slug = existing.slug;

    if (slugInput) {
      slug = await resolveUniqueSlug(toSlug(slugInput), id);
    } else if (hasName && nextName !== existing.name) {
      slug = await resolveUniqueSlug(toSlug(nextName), id);
    }

    await getDb()
      .update(doflins)
      .set({
        nombre: nextName,
        modeloBase: finalBaseModel,
        variante: finalVariantName,
        slug,
        serie: parsedSeries,
        numeroColeccion: parsedCollectionNumber,
        rareza: parsedRarity,
        probabilidad: parsedProbability,
        imagenUrl: imageUrl,
        siluetaUrl: silhouetteUrl,
        activo: parsedActive,
        updatedAt: new Date(),
      })
      .where(eq(doflins.id, id));

    const updated = await fetchDoflinById(id);

    return NextResponse.json(
      {
        status: "ok",
        item: updated,
        message: "Doflin actualizado correctamente.",
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al actualizar el Doflin.";
    return errorResponse(message, 500);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const tokenError = await validateAdminAccess(request);
  if (tokenError) {
    return tokenError;
  }

  const id = parseIdFromRequest(request);
  if (!id) {
    return errorResponse("Falta un id válido en query (?id=).", 400);
  }

  try {
    const payload = (await request.json()) as { active?: unknown };
    if (typeof payload.active !== "boolean") {
      return errorResponse("Debes enviar `active` como boolean.");
    }

    const existing = await fetchDoflinById(id);
    if (!existing) {
      return errorResponse("Doflin no encontrado.", 404);
    }

    await getDb()
      .update(doflins)
      .set({
        activo: payload.active,
        updatedAt: new Date(),
      })
      .where(eq(doflins.id, id));

    const updated = await fetchDoflinById(id);

    return NextResponse.json(
      {
        status: "ok",
        item: updated,
        message: payload.active ? "Doflin activado." : "Doflin desactivado.",
      },
      { status: 200 },
    );
  } catch {
    return errorResponse("No se pudo actualizar el estado del Doflin.", 500);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const tokenError = await validateAdminAccess(request);
  if (tokenError) {
    return tokenError;
  }

  const id = parseIdFromRequest(request);
  if (!id) {
    return errorResponse("Falta un id válido en query (?id=).", 400);
  }

  try {
    const existing = await fetchDoflinById(id);
    if (!existing) {
      return errorResponse("Doflin no encontrado.", 404);
    }

    await getDb().delete(doflins).where(eq(doflins.id, id));

    return NextResponse.json(
      {
        status: "ok",
        message: "Doflin eliminado correctamente.",
      },
      { status: 200 },
    );
  } catch (error) {
    const normalized = extractSqlErrorInfo(error);
    const rawMessage = normalized.message.toLowerCase();

    if (
      normalized.code === "ER_ROW_IS_REFERENCED_2" ||
      normalized.errno === 1451 ||
      rawMessage.includes("foreign key constraint fails") ||
      rawMessage.includes("cannot delete or update a parent row")
    ) {
      return errorResponse(
        "No se puede eliminar porque este Doflin ya está ligado a bolsas/códigos. Desactívalo en lugar de borrarlo.",
        409,
      );
    }

    return errorResponse("No se pudo eliminar el Doflin.", 500);
  }
}
