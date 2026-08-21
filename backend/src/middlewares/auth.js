import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { AppError, asyncHandler } from "./errorHandler.js";
import { config } from "../config/index.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Note: the refresh cookie is deliberately not read here. It is scoped to
  // /api/auth and is only ever exchanged for an access token, never used to
  // authenticate a resource request directly.

  if (!token) {
    return next(new AppError("Not authorized to access this route", StatusCodes.UNAUTHORIZED));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Reject anything that is not an access token. Without this check a
    // refresh token - which lives for 7 days - would authenticate API calls
    // just as well as the 15-minute access token it is meant to mint.
    if (decoded.type !== "access") {
      return next(new AppError("Invalid token type", StatusCodes.UNAUTHORIZED));
    }

    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", StatusCodes.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Not authorized to access this route", StatusCodes.FORBIDDEN)
      );
    }

    next();
  };
};
