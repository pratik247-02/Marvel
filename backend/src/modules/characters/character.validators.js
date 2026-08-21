import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const themeSchema = z.object({
  colorPrimary: z.string().optional(),
  colorSecondary: z.string().optional(),
});

const sectionSchema = z.object({
  type: z.enum(["biography", "timeline", "gallery", "quotes", "trivia", "relationships"]),
  data: z.record(z.any()),
});

export const characterValidators = {
  create: z.object({
    body: z.object({
      name: z.string().min(1).max(100),
      alias: z.string().max(100).optional(),
      description: z.string().max(2000).optional(),
      image: z.string().url().optional(),
      affiliations: z.array(objectIdSchema).optional(),
      appearances: z.array(objectIdSchema).optional(),
      artifactsUsed: z.array(objectIdSchema).optional(),
      powers: z.array(z.string()).optional(),
      sections: z.array(sectionSchema).optional(),
      theme: themeSchema.optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      alias: z.string().max(100).optional(),
      description: z.string().max(2000).optional(),
      image: z.string().url().optional(),
      affiliations: z.array(objectIdSchema).optional(),
      appearances: z.array(objectIdSchema).optional(),
      artifactsUsed: z.array(objectIdSchema).optional(),
      powers: z.array(z.string()).optional(),
      sections: z.array(sectionSchema).optional(),
      theme: themeSchema.optional(),
      // Optional optimistic-concurrency guard. When present the update only
      // applies if the stored __v still matches.
      expectedVersion: z.number().int().min(0).optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
  }),

  addSection: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: sectionSchema,
  }),
};
