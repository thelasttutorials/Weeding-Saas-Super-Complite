import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  plan: string;
  isAdmin: boolean;
  avatarUrl?: string | null;
}

interface AuthContext {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
}

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const login = async (username: string, password: string) => {
    await apiRequest("POST", "/api/auth/login", { username, password });
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    setLocation("/dashboard");
  };

  const register = async (data: RegisterData) => {
    await apiRequest("POST", "/api/auth/register", data);
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    setLocation("/dashboard");
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    queryClient.clear();
    setLocation("/");
  };

  return (
    <AuthCtx.Provider value={{ user: user || null, isLoading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
