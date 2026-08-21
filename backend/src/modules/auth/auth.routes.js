import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import { authValidators } from "./auth.validators.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

/**
 * Login is rate limited far more tightly than the read endpoints.
 *
 * The global limiter allows 100 requests per 15 minutes across the whole API,
 * which is generous enough to let someone try 100 passwords. Five attempts per
 * 15 minutes per IP makes online brute force impractical while staying well
 * above what a person mistyping their password would hit.
 *
 * `skipSuccessfulRequests` means a legitimate user who logs in and out
 * repeatedly is never penalised - only failures count toward the limit.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Try again in a few minutes.",
  },
});

/** Refresh is called often by legitimate clients, so the ceiling is higher. */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validate(authValidators.login), authController.login);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
