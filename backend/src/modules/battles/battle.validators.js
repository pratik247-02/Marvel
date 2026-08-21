import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const significanceEnum = z.enum(["minor", "major", "universe-altering"]);

export const battleValidators = {
  create: z.object({
    body: z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(5000).optional(),
      participants: z.array(objectIdSchema).optional(),
      outcome: z.string().max(1000).optional(),
      movie: objectIdSchema.optional(),
      images: z.array(z.string().url()).optional(),
      location: z.string().optional(),
      winner: objectIdSchema.optional(),
      casualties: z.number().min(0).optional(),
      significance: significanceEnum.optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      participants: z.array(objectIdSchema).optional(),
      outcome: z.string().max(1000).optional(),
      movie: objectIdSchema.optional(),
      images: z.array(z.string().url()).optional(),
      location: z.string().optional(),
      winner: objectIdSchema.optional(),
      casualties: z.number().min(0).optional(),
      significance: significanceEnum.optional(),
      // Optional optimistic-concurrency guard; see utils/concurrency.js
      expectedVersion: z.number().int().min(0).optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
  }),
};
