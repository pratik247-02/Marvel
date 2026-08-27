import { StatusCodes } from "http-status-codes";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export class AppError extends Error {
  constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, StatusCodes.NOT_FOUND));
};

// `_next` is unused but must stay: Express identifies an error handler by its
// four-argument arity, so removing it would silently demote this to normal
// middleware and errors would fall through to the default handler.
export const errorHandler = (err, req, res, _next) => {
  /**
   * A body that is not valid JSON is a client mistake, not a server fault.
   *
   * `express.json()` raises a SyntaxError carrying `body`, and without this it
   * falls through to the 500 branch - reporting an internal error for a
   * truncated request, and burying real 500s in the logs alongside it.
   */
  if (
    err instanceof SyntaxError &&
    err.statusCode === StatusCodes.BAD_REQUEST &&
    "body" in err
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      status: "fail",
      message: "Malformed JSON in request body",
    });
  }

  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || "error";

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
  });

  if (config.nodeEnv === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });
  }

  // Production error response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
  }

  // Programming or unknown errors: don't leak details
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    status: "error",
    message: "Something went wrong",
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
