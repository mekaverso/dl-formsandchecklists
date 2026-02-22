import { create } from "zustand";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  user: UserProfile | null;
  currentOrgId: string | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setCurrentOrgId: (orgId: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  currentOrgId: typeof window !== "undefined" ? localStorage.getItem("org_id") : null,
  isLoading: true,

  setUser: (user) => set({ user }),

  setCurrentOrgId: (orgId) => {
    if (orgId) {
      localStorage.setItem("org_id", orgId);
    } else {
      localStorage.removeItem("org_id");
    }
    set({ currentOrgId: orgId });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("org_id");
    set({ user: null, currentOrgId: null });
  },
}));
