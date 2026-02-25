import { z } from "zod";

import { RARITY_ORDER } from "@/lib/constants/rarity";

const codeRegex = /^[A-Z0-9]{6,12}$/;

export const revealCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(codeRegex, "invalid_format");

export const revealQuerySchema = z.object({
  code: revealCodeSchema,
});

const raritySchema = z.enum(RARITY_ORDER);
const packSizeSchema = z.union([z.literal(1), z.literal(3), z.literal(5)]);

export const doflinSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  series: z.string().min(2),
  collectionNumber: z.number().int().positive(),
  totalCollection: z.number().int().positive(),
  rarity: raritySchema,
  probability: z.number().min(0).max(100),
  imageUrl: z.string().min(1),
  silhouetteUrl: z.string().min(1),
});

export const revealResponseSchema = z.object({
  status: z.literal("ok"),
  code: revealCodeSchema,
  packSize: packSizeSchema,
  firstScan: z.boolean(),
  doflins: z.array(doflinSchema).min(1),
  highestRarity: raritySchema,
  usedAt: z.string(),
  scanCount: z.number().int().nonnegative(),
});

export const collectionItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  series: z.string().min(2),
  collectionNumber: z.number().int().positive(),
  rarity: raritySchema,
  probability: z.number().min(0).max(100),
  imageUrl: z.string().min(1),
  silhouetteUrl: z.string().min(1),
  active: z.boolean(),
});

export const collectionResponseSchema = z.object({
  status: z.literal("ok"),
  collection: z.array(collectionItemSchema),
});

export const statsRemainingResponseSchema = z.object({
  status: z.literal("ok"),
  remaining: z.record(raritySchema, z.number().int().nonnegative()),
  totalRemaining: z.number().int().nonnegative(),
});

export const purchaseIntentPayloadSchema = z.object({
  code: z.string().trim().toUpperCase().optional(),
  doflinId: z.number().int().positive().optional(),
  doflinIds: z.array(z.number().int().positive()).optional(),
  source: z.string().trim().default("reveal_cta"),
});

export function normalizeRevealCode(rawValue: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  const parsed = revealCodeSchema.safeParse(rawValue);
  return parsed.success ? parsed.data : null;
}
