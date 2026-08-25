import { authService } from "./auth.service.js";
import { tokenService } from "./token.service.js";
import { success } from "../../utils/response.js";

/**
 * The refresh token is set as a cookie and never appears in a response body;
 * the access token is returned in the body and never as a cookie. Keeping that
 * split consistent is what makes the storage model work - the client holds the
 * access token in memory, and cannot read the refresh token at all.
 */
const setRefreshCookie = (res, token) => {
  res.cookie(tokenService.REFRESH_COOKIE, token, tokenService.refreshCookieOptions());
  // Readable companion flag, so the frontend can tell whether attempting a
  // restore is worthwhile instead of guaranteeing a 401 for every anonymous
  // visitor. Carries no token - see tokenService.sessionHintCookieOptions.
  res.cookie(tokenService.SESSION_HINT_COOKIE, "1", tokenService.sessionHintCookieOptions());
};

/** Both cookies always move together, so a stale hint cannot outlive the token. */
const clearRefreshCookie = (res) => {
  res.clearCookie(tokenService.REFRESH_COOKIE, tokenService.refreshCookieOptions());
  res.clearCookie(tokenService.SESSION_HINT_COOKIE, tokenService.sessionHintCookieOptions());
};

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      setRefreshCookie(res, refreshToken);
      return success(res, { user, accessToken }, "Signed in");
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const token = req.cookies?.[tokenService.REFRESH_COOKIE];
      const { user, accessToken, refreshToken } = await authService.refresh(token);
      setRefreshCookie(res, refreshToken);
      return success(res, { user, accessToken }, "Session refreshed");
    } catch (error) {
      // A failed refresh should clear the cookie, otherwise the client retries
      // with the same dead token forever.
      clearRefreshCookie(res);
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.cookies?.[tokenService.REFRESH_COOKIE]);
      clearRefreshCookie(res);
      return success(res, null, "Signed out");
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user.sub);
      return success(res, user);
    } catch (error) {
      next(error);
    }
  },
};
