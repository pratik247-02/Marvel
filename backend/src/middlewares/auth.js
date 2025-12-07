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
  // Check for token in cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError("Not authorized to access this route", StatusCodes.UNAUTHORIZED));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
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
