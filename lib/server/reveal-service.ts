import { and, count, eq, sql } from "drizzle-orm";

import { RARITY_ORDER, rarityRank } from "@/lib/constants/rarity";
import { getDb, type Database } from "@/lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins, scanEvents } from "@/lib/db/schema";
import type { CollectionItemDTO, PackSize, Rarity, RevealResponse } from "@/lib/types/doflin";
import {
  collectionResponseSchema,
  revealResponseSchema,
  statsRemainingResponseSchema,
} from "@/lib/validation/reveal";

export type ScanEventType =
  | "scan"
  | "invalid"
  | "reveal_success"
  | "purchase_intent"
  | "rate_limited"
  | "universe_switch"
  | "filter_apply"
  | "card_open"
  | "view_3d";

export class RevealServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode:
      | "invalid_format"
      | "code_not_found"
      | "code_blocked"
      | "rate_limited"
      | "internal_error",
  ) {
    super(message);
    this.name = "RevealServiceError";
  }
}

interface LogScanEventInput {
  eventType: ScanEventType;
  codeInput: string;
  ipHash: string;
  userAgent: string;
  codigoBolsaId?: number;
  database?: Database;
}

interface RevealInput {
  code: string;
  ipHash: string;
  userAgent: string;
  database?: Database;
}

interface PurchaseIntentInput {
  code?: string;
  doflinId?: number;
  doflinIds?: number[];
  ipHash: string;
  userAgent: string;
  database?: Database;
}

const DEFAULT_USER_AGENT = "unknown";

function normalizePackSize(packSize: number, totalItems: number): PackSize {
  if (packSize === 3 || packSize === 5) {
    return packSize;
  }

  if (totalItems === 5) {
    return 5;
  }

  if (totalItems === 3) {
    return 3;
  }

  return 1;
}

export async function logScanEvent(input: LogScanEventInput): Promise<void> {
  const db = input.database ?? getDb();

  await db.insert(scanEvents).values({
    eventType: input.eventType,
    codigoInput: input.codeInput || "N/A",
    codigoBolsaId: input.codigoBolsaId,
    ipHash: input.ipHash,
    userAgent: (input.userAgent || DEFAULT_USER_AGENT).slice(0, 255),
  });
}

export async function revealDoflin(input: RevealInput): Promise<RevealResponse> {
  const db = input.database ?? getDb();

  return db.transaction(async (tx) => {
    const [record] = await tx
      .select({
        codeId: codigosBolsa.id,
        code: codigosBolsa.codigo,
        packSize: codigosBolsa.packSize,
        used: codigosBolsa.usado,
        activationDate: codigosBolsa.fechaActivacion,
        scanCount: codigosBolsa.scanCount,
        status: codigosBolsa.status,
        doflinId: codigosBolsa.doflinId,
      })
      .from(codigosBolsa)
      .where(eq(codigosBolsa.codigo, input.code))
      .limit(1);

    if (!record) {
      await logScanEvent({
        eventType: "invalid",
        codeInput: input.code,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
        database: tx,
      });

      throw new RevealServiceError("Código no encontrado.", 404, "code_not_found");
    }

    if (record.status === "blocked") {
      await logScanEvent({
        eventType: "scan",
        codeInput: input.code,
        codigoBolsaId: record.codeId,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
        database: tx,
      });

      throw new RevealServiceError("Código bloqueado.", 410, "code_blocked");
    }

    const now = new Date();
    const firstScan = !record.used;
    const activationDate = record.activationDate ?? now;

    await tx
      .update(codigosBolsa)
      .set({
        usado: true,
        fechaActivacion: activationDate,
        scanCount: sql`${codigosBolsa.scanCount} + 1`,
        lastScannedAt: now,
        updatedAt: now,
      })
      .where(eq(codigosBolsa.id, record.codeId));

    const [updatedCode] = await tx
      .select({
        scanCount: codigosBolsa.scanCount,
        activationDate: codigosBolsa.fechaActivacion,
      })
      .from(codigosBolsa)
      .where(eq(codigosBolsa.id, record.codeId))
      .limit(1);

    const [collectionMeta] = await tx
      .select({ totalCollection: count(doflins.id) })
      .from(doflins)
      .where(eq(doflins.activo, true));

    let doflinRows = await tx
      .select({
        id: doflins.id,
        name: doflins.nombre,
        baseModel: doflins.modeloBase,
        variantName: doflins.variante,
        series: doflins.serie,
        collectionNumber: doflins.numeroColeccion,
        rarity: doflins.rareza,
        probability: doflins.probabilidad,
        imageUrl: doflins.imagenUrl,
        silhouetteUrl: doflins.siluetaUrl,
      })
      .from(codigosBolsaItems)
      .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
      .where(eq(codigosBolsaItems.codigoBolsaId, record.codeId))
      .orderBy(codigosBolsaItems.posicion);

    // Backward compatibility for existing single-item codes without item rows.
    if (doflinRows.length === 0) {
      const [legacyItem] = await tx
        .select({
          id: doflins.id,
          name: doflins.nombre,
          baseModel: doflins.modeloBase,
          variantName: doflins.variante,
          series: doflins.serie,
          collectionNumber: doflins.numeroColeccion,
          rarity: doflins.rareza,
          probability: doflins.probabilidad,
          imageUrl: doflins.imagenUrl,
          silhouetteUrl: doflins.siluetaUrl,
        })
        .from(doflins)
        .where(eq(doflins.id, record.doflinId))
        .limit(1);

      if (!legacyItem) {
        throw new RevealServiceError(
          "No se encontraron Doflins asignados para este código.",
          500,
          "internal_error",
        );
      }

      doflinRows = [legacyItem];
    }

    const highestRarity = doflinRows.reduce((currentHighest, item) => {
      if (!currentHighest) {
        return item.rarity;
      }

      return rarityRank(item.rarity) > rarityRank(currentHighest) ? item.rarity : currentHighest;
    }, doflinRows[0].rarity);

    const normalizedPackSize = normalizePackSize(record.packSize, doflinRows.length);

    await logScanEvent({
      eventType: "scan",
      codeInput: input.code,
      codigoBolsaId: record.codeId,
      ipHash: input.ipHash,
      userAgent: input.userAgent,
      database: tx,
    });

    await logScanEvent({
      eventType: "reveal_success",
      codeInput: input.code,
      codigoBolsaId: record.codeId,
      ipHash: input.ipHash,
      userAgent: input.userAgent,
      database: tx,
    });

    const response: RevealResponse = {
      status: "ok",
      code: record.code,
      packSize: normalizedPackSize,
      firstScan,
      doflins: doflinRows.map((item) => ({
        id: item.id,
        name: item.name,
        baseModel: item.baseModel,
        variantName: item.variantName,
        series: item.series,
        collectionNumber: item.collectionNumber,
        totalCollection: collectionMeta?.totalCollection ?? 30,
        rarity: item.rarity,
        probability: item.probability,
        imageUrl: item.imageUrl,
        silhouetteUrl: item.silhouetteUrl,
      })),
      highestRarity,
      usedAt: (updatedCode?.activationDate ?? activationDate).toISOString(),
      scanCount: updatedCode?.scanCount ?? record.scanCount + 1,
    };

    return revealResponseSchema.parse(response);
  });
}

export async function getCollection(database?: Database): Promise<CollectionItemDTO[]> {
  const db = database ?? getDb();

  const rows = await db
    .select({
      id: doflins.id,
      name: doflins.nombre,
      baseModel: doflins.modeloBase,
      variantName: doflins.variante,
      series: doflins.serie,
      collectionNumber: doflins.numeroColeccion,
      rarity: doflins.rareza,
      probability: doflins.probabilidad,
      imageUrl: doflins.imagenUrl,
      silhouetteUrl: doflins.siluetaUrl,
      active: doflins.activo,
    })
    .from(doflins)
    .orderBy(doflins.serie, doflins.numeroColeccion, doflins.id);

  return collectionResponseSchema.parse({
    status: "ok",
    collection: rows,
  }).collection;
}

export async function getRemainingByRarity(database?: Database): Promise<{
  remaining: Record<Rarity, number>;
  totalRemaining: number;
}> {
  const db = database ?? getDb();

  const rows = await db
    .select({
      rarity: doflins.rareza,
      remaining: sql<number>`count(*)`,
    })
    .from(codigosBolsaItems)
    .innerJoin(codigosBolsa, eq(codigosBolsaItems.codigoBolsaId, codigosBolsa.id))
    .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
    .where(and(eq(codigosBolsa.usado, false), eq(codigosBolsa.status, "active")))
    .groupBy(doflins.rareza);

  const remaining = Object.fromEntries(RARITY_ORDER.map((rarity) => [rarity, 0])) as Record<
    Rarity,
    number
  >;

  for (const row of rows) {
    remaining[row.rarity] = Number(row.remaining);
  }

  const totalRemaining = Object.values(remaining).reduce((acc, value) => acc + value, 0);

  return statsRemainingResponseSchema.parse({
    status: "ok",
    remaining,
    totalRemaining,
  });
}

export async function logPurchaseIntent(input: PurchaseIntentInput): Promise<void> {
  const db = input.database ?? getDb();
  const normalizedCode = input.code?.trim().toUpperCase();

  let codigoBolsaId: number | undefined;

  if (normalizedCode) {
    const [codeRow] = await db
      .select({ id: codigosBolsa.id, doflinId: codigosBolsa.doflinId })
      .from(codigosBolsa)
      .where(eq(codigosBolsa.codigo, normalizedCode))
      .limit(1);

    if (codeRow) {
      codigoBolsaId = codeRow.id;
    }
  }

  await logScanEvent({
    eventType: "purchase_intent",
    codeInput:
      normalizedCode || `DOFLIN-${input.doflinId ?? input.doflinIds?.[0] ?? "NA"}`,
    codigoBolsaId,
    ipHash: input.ipHash,
    userAgent: input.userAgent,
    database: db,
  });
}
