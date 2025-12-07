import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "./errorHandler.js";

/**
 * Middleware to validate request data against a Zod schema
 * @param {import("zod").ZodSchema} schema - Zod schema to validate against
 * @param {"body" | "query" | "params"} source - Source of data to validate
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      req[source] = validatedData;
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
