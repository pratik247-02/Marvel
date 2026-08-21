import { StatusCodes } from "http-status-codes";
import User from "./user.model.js";
import { tokenService } from "./token.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { logger } from "../../utils/logger.js";

/** Shape a user for the client - never the hash, never the token version. */
const publicUser = (user) => ({
  id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role,
  lastLoginAt: user.lastLoginAt,
});

export const authService = {
  /**
   * Verify credentials and issue a token pair.
   *
   * The error message is identical whether the email is unknown or the
   * password is wrong. Distinguishing them would let an attacker enumerate
   * which addresses have accounts.
   */
  async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );

    if (!user || !(await user.verifyPassword(password))) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: publicUser(user),
      accessToken: tokenService.signAccessToken(user),
      refreshToken: tokenService.signRefreshToken(user),
    };
  },

  /**
   * Rotate a refresh token, with reuse detection.
   *
   * Every refresh issues a new token and bumps the user's version, so a given
   * refresh token is valid exactly once. If a token arrives carrying a version
   * behind the stored one, it has already been spent - which under normal use
   * cannot happen, and therefore indicates the token was captured and replayed.
   *
   * The response to that is not to reject the single request but to invalidate
   * the entire family, forcing a fresh login. That way a stolen token cannot be
   * used even if the attacker got there first: whichever party refreshes second
   * trips the check and both are logged out.
   */
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token missing", StatusCodes.UNAUTHORIZED);
    }

    let payload;
    try {
      payload = tokenService.verify(refreshToken, "refresh");
    } catch {
      throw new AppError("Invalid or expired session", StatusCodes.UNAUTHORIZED);
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError("Invalid or expired session", StatusCodes.UNAUTHORIZED);
    }

    if (payload.version !== user.refreshTokenVersion) {
      // Replay detected. Burn the family.
      user.refreshTokenVersion += 1;
      await user.save();
      logger.warn(
        `Refresh token reuse detected for user ${user._id}; all sessions invalidated`
      );
      throw new AppError(
        "Session invalidated, please sign in again",
        StatusCodes.UNAUTHORIZED
      );
    }

    user.refreshTokenVersion += 1;
    await user.save();

    return {
      user: publicUser(user),
      accessToken: tokenService.signAccessToken(user),
      refreshToken: tokenService.signRefreshToken(user),
    };
  },

  /**
   * Log out by bumping the version, which invalidates every outstanding
   * refresh token for this user rather than just the one presented.
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      return;
    }
    try {
      const payload = tokenService.verify(refreshToken, "refresh");
      await User.findByIdAndUpdate(payload.sub, { $inc: { refreshTokenVersion: 1 } });
    } catch {
      // An invalid token on logout is not an error worth surfacing - the
      // caller wanted the session gone, and it is gone.
    }
  },

  async me(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    return publicUser(user);
  },

  /** Used by the CLI to seed the first admin. */
  async createUser({ email, password, name, role = "user" }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError("An account with that email already exists", StatusCodes.CONFLICT);
    }
    const user = await User.create({
      email: email.toLowerCase(),
      name,
      role,
      passwordHash: password,
    });
    return publicUser(user);
  },
};
