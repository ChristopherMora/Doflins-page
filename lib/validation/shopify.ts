import { z } from "zod";

const universeSchema = z.union([z.literal("animals"), z.literal("multiverse"), z.literal("mega")]);

const cartLineInputSchema = z.object({
  merchandiseId: z.string().trim().min(1),
  quantity: z.number().int().positive().max(99),
});

const cartLineUpdateSchema = z.object({
  id: z.string().trim().min(1),
  quantity: z.number().int().positive().max(99),
});

const shopAnalyticsContextSchema = z.object({
  sessionId: z.string().trim().min(8).max(64),
  visitorId: z.string().trim().max(64).optional(),
  visitNumber: z.number().int().nonnegative().optional(),
  utmSource: z.string().trim().max(80).optional(),
  utmMedium: z.string().trim().max(80).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  viewportWidth: z.number().int().nonnegative().optional(),
  universe: z.string().trim().max(32).optional(),
});

export const productsQuerySchema = z.object({
  universe: universeSchema.default("animals"),
});

export const productHandleParamsSchema = z.object({
  handle: z.string().trim().min(1),
});

export const cartCreateBodySchema = z
  .object({
    lines: z.array(cartLineInputSchema).max(20).optional(),
  })
  .default({});

export const cartLineAddBodySchema = z.object({
  lines: z.array(cartLineInputSchema).min(1).max(20),
});

export const cartLineUpdateBodySchema = z.object({
  lines: z.array(cartLineUpdateSchema).min(1).max(20),
});

export const cartLineRemoveBodySchema = z.object({
  lineIds: z.array(z.string().trim().min(1)).min(1).max(20),
});

export const cartDiscountBodySchema = z.object({
  code: z.string().trim().min(1).max(64),
});

export const cartCheckoutBodySchema = z
  .object({
    analytics: shopAnalyticsContextSchema.optional(),
  })
  .default({});
