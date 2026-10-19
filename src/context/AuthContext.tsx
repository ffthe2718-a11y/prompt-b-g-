import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/types/salon";
import { ApiRequestError, authApi, tokenStore, unauthorizedEvent } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  profile: Record<string, unknown> | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isVendor: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  loginWithGoogleCode: (code: string) => Promise<AuthUser>;
  setUserFromServer: (user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    if (!tokenStore.get()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { user: fresh } = await authApi.me();
      setUser(fresh);
      return fresh;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        tokenStore.clear();
        setUser(null);
      } else if (!(error instanceof ApiRequestError) || error.status !== 0) {
        console.warn("Could not refresh session:", error);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStore.clear();
      setUser(null);
      setLoading(false);
    };
    window.addEventListener(unauthorizedEvent, handleUnauthorized);
    return () => window.removeEventListener(unauthorizedEvent, handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    tokenStore.set(result.token);
    setUser(result.user);
    setLoading(false);
    return result.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register({ name, email, password });
    tokenStore.set(result.token);
    setUser(result.user);
    setLoading(false);
    return result.user;
  }, []);

  const loginWithGoogleCode = useCallback(async (code: string) => {
    const result = await authApi.exchangeGoogleCode(code);
    tokenStore.set(result.token);
    setUser(result.user);
    setLoading(false);
    return result.user;
  }, []);

  const setUserFromServer = useCallback((fresh: AuthUser) => {
    setUser(fresh);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const profile = useMemo<Record<string, unknown> | null>(() => {
    if (!user) return null;
    return {
      ...user,
      role: user.role === "super_admin" ? "Admin" : "Owner",
      shopId: user.salon?.id ?? null,
      shopSlug: user.salon?.slug ?? null,
      slug: user.salon?.slug ?? null,
    };
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: user?.role === "super_admin",
      isOwner: user?.role === "owner" && !!user.salon,
      isVendor: false,
      login,
      register,
      loginWithGoogleCode,
      setUserFromServer,
      logout,
      refresh,
    }),
    [user, profile, loading, login, register, loginWithGoogleCode, setUserFromServer, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
