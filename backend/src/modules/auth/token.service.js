import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";

/**
 * Token issuing and verification.
 *
 * Two tokens with deliberately different lifetimes and storage:
 *
 *   access  - 15 minutes, returned in the response body, held in memory by the
 *             client. Short enough that a leaked one expires before it is
 *             worth much, and never written to localStorage where any XSS
 *             could read it.
 *
 *   refresh - 7 days, delivered as an httpOnly cookie so JavaScript cannot
 *             read it at all. Carries a version number, which is what makes
 *             reuse detection possible.
 *
 * The `type` claim exists so an access token cannot be presented at the
 * refresh endpoint or vice versa. Without it, the 7-day refresh token would
 * work as a 7-day access token.
 */

const ACCESS_TTL = "15m";
const REFRESH_TTL_DAYS = 7;

export const tokenService = {
  signAccessToken(user) {
    return jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        role: user.role,
        type: "access",
      },
      config.jwtSecret,
      { expiresIn: ACCESS_TTL }
    );
  },

  signRefreshToken(user) {
    return jwt.sign(
      {
        sub: String(user._id),
        version: user.refreshTokenVersion,
        type: "refresh",
      },
      config.jwtSecret,
      { expiresIn: `${REFRESH_TTL_DAYS}d` }
    );
  },

  /** Throws if the token is invalid, expired, or the wrong type. */
  verify(token, expectedType) {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.type !== expectedType) {
      throw new jwt.JsonWebTokenError(`Expected a ${expectedType} token`);
    }
    return payload;
  },

  /**
   * Cookie options for the refresh token.
   *
   * `httpOnly` keeps it away from JavaScript. `sameSite: strict` means it is
   * not sent on cross-site requests at all, which is CSRF protection for the
   * refresh endpoint specifically. `path` scopes it so it is not attached to
   * every API call - only the auth routes that actually need it.
   */
  refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    };
  },

  /**
   * Options for the readable companion cookie.
   *
   * The refresh cookie is httpOnly by design, so the frontend cannot tell
   * whether a session exists and would have to ask the server on every page
   * load. For an anonymous visitor - the normal case on a public site - that
   * is a guaranteed 401 per load, and enough navigation to trip the rate
   * limiter.
   *
   * This carries no token and no user data: it is a flag whose presence means
   * "a refresh cookie was issued, so attempting a restore is worthwhile". It is
   * set and cleared in lockstep with the real one, and forging it grants
   * nothing - the refresh still fails without the httpOnly token.
   *
   * Deliberately scoped to "/" rather than "/api/auth", because the page that
   * needs to read it is served from the site root.
   */
  sessionHintCookieOptions() {
    return {
      httpOnly: false,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    };
  },

  REFRESH_COOKIE: "refresh_token",
  SESSION_HINT_COOKIE: "has_session",
};
