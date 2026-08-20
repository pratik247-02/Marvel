import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "./errorHandler.js";

/**
 * Middleware to validate request data against a Zod schema.
 *
 * Schemas are written as an envelope - `z.object({ body, params, query })` -
 * with each key optional. The whole envelope is parsed in one pass so a single
 * failure response can report errors across all three sources, then each
 * validated part is assigned back onto the request (picking up Zod defaults
 * and coercions, e.g. `page`/`limit` coerced to numbers).
 *
 * @param {import("zod").ZodSchema} schema - Zod envelope schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Only assign back what the schema actually declared. `req.params` and
      // `req.query` are getters on some Express versions, so guard the write.
      if (validated.body !== undefined) {req.body = validated.body;}
      if (validated.params !== undefined) {
        Object.assign(req.params, validated.params);
      }
      if (validated.query !== undefined) {
        Object.assign(req.query, validated.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join(".");
          if (!acc[path]) {
            acc[path] = [];
          }
          acc[path].push(err.message);
          return acc;
        }, {});

        return next(new AppError("Validation failed", StatusCodes.BAD_REQUEST, errors));
      }
      next(error);
    }
  };
};
