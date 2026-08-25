import { apiPost, apiGet } from "@/services/main";
import { tokenStore } from "@/services/main/tokenStore";
import type { ApiResponse, AuthUser, LoginInput, LoginResponse } from "@/types";

/**
 * Whether the server has issued a refresh cookie for this browser.
 *
 * Reads the non-httpOnly companion flag. Forging it grants nothing - the
 * refresh call still fails without the real token - so this is only ever an
 * optimisation that avoids a pointless request, never an authorisation check.
 */
const SESSION_HINT_COOKIE = "has_session";

const hasSessionHint = (): boolean => {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${SESSION_HINT_COOKIE}=`));
};

export const authService = {
  /**
   * Exchange credentials for an access token.
   *
   * The refresh token is set by the server as an httpOnly cookie and never
   * appears in this response, which is why there is nothing to store for it.
   */
  async login(input: LoginInput): Promise<ApiResponse<LoginResponse>> {
    const response = await apiPost<LoginResponse, LoginInput>("/auth/login", input);
    tokenStore.set(response.data.accessToken);
    return response;
  },

  /**
   * Restore a session on page load.
   *
   * The access token lives in memory only, so a reload starts with none. The
   * refresh cookie survives, and this trades it for a fresh access token.
   * Returns null when there is no valid session, which is the normal case for
   * an anonymous visitor rather than an error.
   */
  async restore(): Promise<AuthUser | null> {
    // Skip the call entirely when no session was ever issued.
    //
    // The refresh token is httpOnly, so this cannot check for it directly; the
    // server sets a readable companion flag alongside it that carries no token.
    // Without this guard every anonymous visitor - the normal case on a public
    // site - fires a guaranteed 401 on every page load, and enough navigation
    // trips the login rate limiter.
    if (!hasSessionHint()) {
      tokenStore.clear();
      return null;
    }

    try {
      const response = await apiPost<LoginResponse>("/auth/refresh");
      tokenStore.set(response.data.accessToken);
      return response.data.user;
    } catch {
      tokenStore.clear();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiPost("/auth/logout");
    } finally {
      // Clear locally even if the request failed - the user asked to leave.
      tokenStore.clear();
    }
  },

  async me(): Promise<ApiResponse<AuthUser>> {
    return apiGet<AuthUser>("/auth/me");
  },
};
