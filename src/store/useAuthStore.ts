"use client";

import { create } from "zustand";

export interface UserLanguageItem {
  id?: string;
  code: string;
  type: "native" | "learning";
  proficiency: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";
  isPrimaryLearning: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  audioBioUrl?: string;
  bio?: string;
  countryCode?: string;
  isVip: boolean;
  coinsBalance: number;
  currentStreak: number;
  totalTalkingTimeMinutes?: number;
  presence?: {
    online: boolean;
    activeRoomId: string | null;
  };
  languages?: UserLanguageItem[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (identifier: string, password: string) => Promise<{ success: boolean; dailyBonusAwarded?: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    nativeLanguage?: string;
    learningLanguage?: string;
    learningLevel?: string;
    bio?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated && data.user) {
        set({ user: data.user, isAuthenticated: true, error: null });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (err: unknown) {
      set({
        user: null,
        isAuthenticated: false,
        error: err instanceof Error ? err.message : "Failed to load user session",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Login failed", isLoading: false });
        return { success: false, error: data.error || "Login failed" };
      }

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, dailyBonusAwarded: data.dailyBonusAwarded };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error during login";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Registration failed", isLoading: false });
        return { success: false, error: data.error || "Registration failed" };
      }

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error during registration";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to update profile" };
      }

      set((state) => ({
        user: state.user ? { ...state.user, ...data.user } : data.user,
      }));

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Update error",
      };
    }
  },
}));
