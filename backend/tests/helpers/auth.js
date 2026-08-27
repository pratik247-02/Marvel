/**
 * Token and user helpers for route tests.
 *
 * Tokens are signed with the real `tokenService`, not hand-rolled here. A test
 * that builds its own JWT is testing the test's idea of the token format; if
 * the claim names or the `type` field change, this keeps working and the tests
 * keep meaning something.
 */

import User from "../../src/modules/auth/user.model.js";
import { tokenService } from "../../src/modules/auth/token.service.js";
import jwt from "jsonwebtoken";
import { config } from "../../src/config/index.js";

/** Create a user directly, bypassing the (admin-only) registration route. */
export async function createUser({ role = "user", email } = {}) {
  // The field is `passwordHash`, and a pre-save hook does the hashing - so a
  // plaintext value is assigned here and stored hashed, which is also what
  // the real registration path does.
  return User.create({
    email: email ?? `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`,
    passwordHash: "Test-password-1",
    role,
  });
}

export async function createAdmin() {
  return createUser({ role: "admin" });
}

/** A valid access token for a user. */
export function accessTokenFor(user) {
  return tokenService.signAccessToken(user);
}

/**
 * An access token that expired an hour ago.
 *
 * Signed with the real secret so it fails on expiry specifically, rather than
 * on the signature - otherwise the test would pass for the wrong reason and
 * would keep passing if expiry checking were removed entirely.
 */
export function expiredTokenFor(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role, type: "access" },
    config.jwtSecret,
    { expiresIn: "-1h" }
  );
}

/**
 * A refresh token presented where an access token is expected.
 *
 * The interesting case: correctly signed, unexpired, and still must be
 * rejected. A refresh token lives for seven days, so accepting one as an
 * access token would silently extend the 15-minute window to a week.
 */
export function refreshTokenFor(user) {
  return tokenService.signRefreshToken(user);
}

/** Signed with the wrong secret - a forged token. */
export function forgedTokenFor(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role, type: "access" },
    "not-the-real-secret",
    { expiresIn: "15m" }
  );
}
