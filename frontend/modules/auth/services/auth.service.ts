import { apiPost, apiGet } from "@/services/main";
import { tokenStore } from "@/services/main/tokenStore";
import type { ApiResponse, AuthUser, LoginInput, LoginResponse } from "@/types";

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
