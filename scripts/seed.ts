import { inArray } from "drizzle-orm";

import { getDb } from "../lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins } from "../lib/db/schema";
import type { PackSize, Rarity } from "../lib/types/doflin";

interface SeedDoflin {
  nombre: string;
  serie: "Animals" | "Multiverse";
  rareza: Rarity;
  probabilidad: number;
}

interface PackPlan {
  size: PackSize;
  count: number;
}

interface PlannedCode {
  codigo: string;
  packSize: PackSize;
  itemIds: number[];
}

const catalog: SeedDoflin[] = [
  { nombre: "Brisa Solar", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Jaguar Prisma", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Koala Bronce", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Lobo Ceniza", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Panda Nube", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Mono Magma", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Tigre Arena", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Pulpo Jade", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Axolote Coral", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Búho Cobre", serie: "Animals", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Tortuga Hielo", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Fénix Menta", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "León Quartz", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Delfín Aurora", serie: "Multiverse", rareza: "COMMON", probabilidad: 45 },
  { nombre: "Coyote Volt", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Pantera Pixel", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Rana Nova", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Gacela Fractal", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Erizo Vapor", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Halcón Neon", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Lince Rayo", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Tiburón Cobalto", serie: "Multiverse", rareza: "RARE", probabilidad: 25 },
  { nombre: "Dragón Plasma", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Mantis Vortex", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Cuervo Quantum", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Fuego Ártico", serie: "Multiverse", rareza: "EPIC", probabilidad: 15 },
  { nombre: "Centella Dorada", serie: "Multiverse", rareza: "LEGENDARY", probabilidad: 8 },
  { nombre: "Titanio Lunar", serie: "Multiverse", rareza: "LEGENDARY", probabilidad: 8 },
  { nombre: "Omega Carmesí", serie: "Multiverse", rareza: "ULTRA", probabilidad: 5 },
  { nombre: "Sombra Eterna", serie: "Multiverse", rareza: "MYTHIC", probabilidad: 2 },
];

const packPlan: PackPlan[] = [
  { size: 1, count: 300 },
  { size: 3, count: 120 },
  { size: 5, count: 80 },
];

const rarityWeights: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: "COMMON", weight: 45 },
  { rarity: "RARE", weight: 25 },
  { rarity: "EPIC", weight: 15 },
  { rarity: "LEGENDARY", weight: 8 },
  { rarity: "ULTRA", weight: 5 },
  { rarity: "MYTHIC", weight: 2 },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildCode(index: number): string {
  return `DF${String(index).padStart(6, "0")}`;
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRarity(rng: () => number): Rarity {
  const roll = rng() * 100;
  let cumulative = 0;

  for (const item of rarityWeights) {
    cumulative += item.weight;
    if (roll <= cumulative) {
      return item.rarity;
    }
  }

  return "COMMON";
}

async function main(): Promise<void> {
  const db = getDb();

  const doflinValues = catalog.map((item, index) => {
    const number = index + 1;
    return {
      nombre: `Doflin ${item.nombre}`,
      slug: `${slugify(item.nombre)}-${String(number).padStart(2, "0")}`,
      serie: item.serie,
      numeroColeccion: number,
      rareza: item.rareza,
      probabilidad: item.probabilidad,
      imagenUrl: `/images/doflins/doflin-${String(number).padStart(2, "0")}.webp`,
      siluetaUrl: `/images/doflins/silueta-${String(number).padStart(2, "0")}.webp`,
      activo: true,
    };
  });

  const existingDoflinsRows = await db
    .select({ slug: doflins.slug })
    .from(doflins)
    .where(inArray(doflins.slug, doflinValues.map((item) => item.slug)));

  const existingDoflinSlugs = new Set(existingDoflinsRows.map((item) => item.slug));
  const missingDoflins = doflinValues.filter((item) => !existingDoflinSlugs.has(item.slug));

  if (missingDoflins.length) {
    await db.insert(doflins).values(missingDoflins);
  }

  const persistedDoflins = await db
    .select({
      id: doflins.id,
      rareza: doflins.rareza,
    })
    .from(doflins)
    .orderBy(doflins.numeroColeccion);

  const byRarity = persistedDoflins.reduce(
    (acc, item) => {
      acc[item.rareza].push(item.id);
      return acc;
    },
    {
      COMMON: [] as number[],
      RARE: [] as number[],
      EPIC: [] as number[],
      LEGENDARY: [] as number[],
      ULTRA: [] as number[],
      MYTHIC: [] as number[],
    },
  );

  const cursors: Record<Rarity, number> = {
    COMMON: 0,
    RARE: 0,
    EPIC: 0,
    LEGENDARY: 0,
    ULTRA: 0,
    MYTHIC: 0,
  };

  function pickDoflinIdByRarity(rarity: Rarity): number {
    const pool = byRarity[rarity];

    if (!pool.length) {
      const fallback = byRarity.COMMON[0];
      if (!fallback) {
        throw new Error("No hay Doflins COMMON cargados para fallback.");
      }
      return fallback;
    }

    const cursor = cursors[rarity];
    const selected = pool[cursor % pool.length];
    cursors[rarity] = cursor + 1;
    return selected;
  }

  const rng = mulberry32(20260225);

  const plannedCodes: PlannedCode[] = [];
  let codeIndex = 1;

  for (const plan of packPlan) {
    for (let i = 0; i < plan.count; i += 1) {
      const code = buildCode(codeIndex);
      const itemIds: number[] = [];

      for (let position = 1; position <= plan.size; position += 1) {
        const rarity = pickRarity(rng);
        itemIds.push(pickDoflinIdByRarity(rarity));
      }

      plannedCodes.push({
        codigo: code,
        packSize: plan.size,
        itemIds,
      });

      codeIndex += 1;
    }
  }

  const codeList = plannedCodes.map((item) => item.codigo);
  const existingCodesRows = await db
    .select({ codigo: codigosBolsa.codigo, id: codigosBolsa.id })
    .from(codigosBolsa)
    .where(inArray(codigosBolsa.codigo, codeList));

  const existingCodeMap = new Map(existingCodesRows.map((row) => [row.codigo, row.id]));
  const missingCodes = plannedCodes.filter((item) => !existingCodeMap.has(item.codigo));

  if (missingCodes.length) {
    await db.insert(codigosBolsa).values(
      missingCodes.map((item) => ({
        codigo: item.codigo,
        packSize: item.packSize,
        doflinId: item.itemIds[0],
        status: "active" as const,
      })),
    );
  }

  const persistedCodes = await db
    .select({
      id: codigosBolsa.id,
      codigo: codigosBolsa.codigo,
    })
    .from(codigosBolsa)
    .where(inArray(codigosBolsa.codigo, codeList));

  const codeIdByCode = new Map(persistedCodes.map((item) => [item.codigo, item.id]));
  const allCodeIds = persistedCodes.map((item) => item.id);

  if (!allCodeIds.length) {
    throw new Error("No se pudieron persistir códigos de bolsa.");
  }

  const existingItemsRows = await db
    .select({
      codeId: codigosBolsaItems.codigoBolsaId,
      position: codigosBolsaItems.posicion,
    })
    .from(codigosBolsaItems)
    .where(inArray(codigosBolsaItems.codigoBolsaId, allCodeIds));

  const existingItemSet = new Set(existingItemsRows.map((row) => `${row.codeId}:${row.position}`));

  const missingItems: Array<{ codigoBolsaId: number; doflinId: number; posicion: number }> = [];

  for (const plannedCode of plannedCodes) {
    const codeId = codeIdByCode.get(plannedCode.codigo);
    if (!codeId) {
      continue;
    }

    plannedCode.itemIds.forEach((doflinId, index) => {
      const position = index + 1;
      const key = `${codeId}:${position}`;
      if (existingItemSet.has(key)) {
        return;
      }

      missingItems.push({
        codigoBolsaId: codeId,
        doflinId,
        posicion: position,
      });
    });
  }

  if (missingItems.length) {
    await db.insert(codigosBolsaItems).values(missingItems);
  }

  console.log(
    `Seed completado. Nuevos Doflins: ${missingDoflins.length}, nuevos códigos: ${missingCodes.length}, nuevos items: ${missingItems.length}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("Error al ejecutar seed", error);
    process.exit(1);
  });
