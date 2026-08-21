import { z } from "zod";
import { emailSchema, passwordSchema } from "../../validators/index.js";

export const authValidators = {
  login: z.object({
    body: z.object({
      email: emailSchema,
      // Deliberately not `passwordSchema`: login validates against the stored
      // hash, not against the current complexity policy. Applying the policy
      // here would lock out anyone whose password predates a rule change, and
      // would leak the policy to an attacker probing the endpoint.
      password: z.string().min(1, "Password is required"),
    }),
  }),

  createUser: z.object({
    body: z.object({
      email: emailSchema,
      password: passwordSchema,
      name: z.string().min(1).max(100).optional(),
      role: z.enum(["admin", "user"]).optional(),
    }),
  }),
};
