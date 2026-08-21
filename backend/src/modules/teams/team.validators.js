import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const statusEnum = z.enum(["active", "disbanded", "reformed", "unknown"]);

const themeSchema = z.object({
  colorPrimary: z.string().optional(),
  colorSecondary: z.string().optional(),
});

export const teamValidators = {
  create: z.object({
    body: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(3000).optional(),
      image: z.string().url().optional(),
      logo: z.string().url().optional(),
      members: z.array(objectIdSchema).optional(),
      leaders: z.array(objectIdSchema).optional(),
      appearances: z.array(objectIdSchema).optional(),
      headquarters: z.string().optional(),
      founded: z.string().optional(),
      status: statusEnum.optional(),
      theme: themeSchema.optional(),
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
      logo: z.string().url().optional(),
      members: z.array(objectIdSchema).optional(),
      leaders: z.array(objectIdSchema).optional(),
      appearances: z.array(objectIdSchema).optional(),
      headquarters: z.string().optional(),
      founded: z.string().optional(),
      status: statusEnum.optional(),
      theme: themeSchema.optional(),
      // Optional optimistic-concurrency guard; see utils/concurrency.js
      expectedVersion: z.number().int().min(0).optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
  }),

  addMember: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      memberId: objectIdSchema,
    }),
  }),

  removeMember: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      memberId: objectIdSchema,
    }),
  }),
};
