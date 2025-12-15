import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const statusEnum = z.enum(["active", "destroyed", "unknown", "lost"]);

export const artifactValidators = {
  create: z.object({
    body: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(3000).optional(),
      image: z.string().url().optional(),
      holders: z.array(objectIdSchema).optional(),
      appearances: z.array(objectIdSchema).optional(),
      origin: z.string().optional(),
      powers: z.array(z.string()).optional(),
      status: statusEnum.optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(3000).optional(),
      image: z.string().url().optional(),
      holders: z.array(objectIdSchema).optional(),
      appearances: z.array(objectIdSchema).optional(),
      origin: z.string().optional(),
      powers: z.array(z.string()).optional(),
      status: statusEnum.optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
  }),
};
