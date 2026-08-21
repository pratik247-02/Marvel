"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { authService } from "../services/auth.service";
import { setSessionExpiredHandler } from "@/services/main/config";
import type { AuthUser, LoginInput } from "@/types";

/**
 * Auth state for the app.
 *
 * `isRestoring` exists to distinguish "we do not know yet" from "definitely
 * signed out". Without it, a guarded page would flash its login screen on
 * every reload while the refresh call is still in flight, then swap to the
 * real content - which looks broken even though nothing is wrong.
 */

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRestoring: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attempt to restore a session from the refresh cookie on mount.
  useEffect(() => {
    let cancelled = false;
    authService
      .restore()
      .then((restored) => {
        if (!cancelled) {
          setUser(restored);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoring(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When a background refresh fails, drop the user rather than leaving stale
  // state that says signed-in while every request 401s.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    try {
      const response = await authService.login(input);
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not sign in";
      setError(message);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isRestoring,
      error,
      login,
      logout,
    }),
    [user, isRestoring, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
