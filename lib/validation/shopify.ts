import { z } from "zod";

const universeSchema = z.union([z.literal("animals"), z.literal("multiverse")]);

const cartLineInputSchema = z.object({
  merchandiseId: z.string().trim().min(1),
  quantity: z.number().int().positive().max(99),
});

const cartLineUpdateSchema = z.object({
  id: z.string().trim().min(1),
  quantity: z.number().int().positive().max(99),
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

