import { z } from "zod";

/** A character reference: either a 24-char ObjectId or a slug. */
const characterRef = z
  .string()
  .min(1, "Required")
  .max(120)
  .regex(/^[0-9a-fA-F]{24}$|^[a-z0-9-]+$/, "Must be an ObjectId or a slug");

export const graphValidators = {
  path: z.object({
    query: z.object({
      from: characterRef,
      to: characterRef,
      mode: z.enum(["weighted", "hops"]).optional().default("weighted"),
    }),
  }),

  network: z.object({
    params: z.object({
      ref: characterRef,
    }),
    query: z.object({
      depth: z.coerce.number().int().min(1).max(4).optional().default(1),
    }),
  }),

  stats: z.object({
    query: z.object({
      limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    }),
  }),
};
