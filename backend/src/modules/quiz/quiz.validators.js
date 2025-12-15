import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const optionSchema = z.object({
  text: z.string().min(1),
  value: z.string().min(1),
});

const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1).max(500),
  options: z.array(optionSchema).min(2),
  image: z.string().url().optional(),
});

const resultLogicSchema = z.object({
  heroId: objectIdSchema,
  logic: z.record(z.array(z.string())),
  description: z.string().max(1000).optional(),
});

export const quizValidators = {
  create: z.object({
    body: z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      image: z.string().url().optional(),
      questions: z.array(questionSchema).min(1),
      results: z.array(resultLogicSchema).min(1),
      isActive: z.boolean().optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      image: z.string().url().optional(),
      questions: z.array(questionSchema).optional(),
      results: z.array(resultLogicSchema).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
  }),

  submit: z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      answers: z.record(z.string()),
    }),
  }),
};
