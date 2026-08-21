import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const phaseEnum = z.enum(["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"]);

export const movieValidators = {
  create: z.object({
    body: z.object({
      title: z.string().min(1).max(200),
      releaseYear: z.number().min(2008).max(2030),
      phase: phaseEnum,
      characters: z.array(objectIdSchema).optional(),
      poster: z.string().url().optional(),
      synopsis: z.string().max(5000).optional(),
      director: z.string().optional(),
      boxOffice: z.number().optional(),
      runtime: z.number().optional(),
      rating: z.number().min(0).max(10).optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      title: z.string().min(1).max(200).optional(),
      releaseYear: z.number().min(2008).max(2030).optional(),
      phase: phaseEnum.optional(),
      characters: z.array(objectIdSchema).optional(),
      poster: z.string().url().optional(),
      synopsis: z.string().max(5000).optional(),
      director: z.string().optional(),
      boxOffice: z.number().optional(),
      runtime: z.number().optional(),
      rating: z.number().min(0).max(10).optional(),
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
