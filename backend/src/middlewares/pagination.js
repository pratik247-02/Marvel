import { StatusCodes } from "http-status-codes";
import { AppError } from "./errorHandler.js";

/**
 * Normalise `page` and `limit` before they reach a service.
 *
 * Every list service parsed these itself with `parseInt`, which accepts
 * anything: `page=-5` became `skip: -60`, which the MongoDB driver rejects as
 * a server error, so a client typo surfaced as a 500. `page=abc` became `NaN`
 * and produced `skip: NaN`, with the same result.
 *
 * Handled here rather than in six validators because six copies of a rule is
 * five chances for it to drift, and this one is identical everywhere.
 *
 * A page past the end of the data is deliberately *not* an error - it is a
 * valid question with an empty answer, and returning 400 there would break
 * ordinary pagination the moment a list shrinks.
 */

/** Beyond this a single response is large enough to be a denial-of-service. */
const MAX_LIMIT = 100;

export const normalizePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const parsed = Number(page);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return next(
        new AppError(
          "`page` must be a positive integer",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    req.query.page = parsed;
  }

  if (limit !== undefined) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return next(
        new AppError(
          "`limit` must be a positive integer",
          StatusCodes.BAD_REQUEST
        )
      );
    }
    if (parsed > MAX_LIMIT) {
      return next(
        new AppError(
          `\`limit\` cannot exceed ${MAX_LIMIT}`,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    req.query.limit = parsed;
  }

  return next();
};
