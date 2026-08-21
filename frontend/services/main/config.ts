import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { APP_CONFIG } from "@/config";
import { tokenStore } from "./tokenStore";

const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  // Required for the refresh cookie to travel on cross-origin calls.
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Silent refresh on 401.
 *
 * Access tokens last 15 minutes, so an active session will hit expiry mid-use.
 * Rather than bouncing the user to a login screen, a 401 triggers one refresh
 * and the original request is replayed with the new token.
 *
 * Two failure modes this has to avoid:
 *
 *   Stampede - a page firing several requests at once would each see a 401 and
 *   each start their own refresh. Since refresh tokens rotate and reuse is
 *   treated as theft, that would invalidate the session outright. So the first
 *   401 starts the refresh and every other request waits on that same promise.
 *
 *   Infinite loop - if the refresh call itself 401s, retrying it would spin
 *   forever. The `_retried` marker and skipping the refresh endpoint stop that.
 */

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

/** Called when refresh fails, so the app can send the user to sign in. */
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

async function refreshAccessToken(): Promise<string | null> {
  try {
    // A bare axios call, not apiClient: going through the instance would
    // re-enter this interceptor on failure.
    const response = await axios.post<{ data: { accessToken: string } }>(
      `${APP_CONFIG.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 15000 }
    );
    const token = response.data?.data?.accessToken ?? null;
    tokenStore.set(token);
    return token;
  } catch {
    tokenStore.clear();
    onSessionExpired?.();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;

    const isAuthEndpoint =
      original?.url?.includes("/auth/refresh") || original?.url?.includes("/auth/login");

    if (error.response?.status !== 401 || !original || original._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retried = true;

    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });

    const token = await refreshInFlight;
    if (!token) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return apiClient(original);
  }
);

export { apiClient };
export type { AxiosRequestConfig };
