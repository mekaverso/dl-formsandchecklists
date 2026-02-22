"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, setTokens, clearTokens } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile, TokenResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useCurrentUser() {
  const { setUser, setLoading } = useAuthStore();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<UserProfile>("/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
      // Auto-select first org if none selected
      const currentOrgId = useAuthStore.getState().currentOrgId;
      if (!currentOrgId && query.data.organizations.length > 0) {
        useAuthStore.getState().setCurrentOrgId(query.data.organizations[0].organization_id);
      }
    }
    setLoading(query.isLoading);
  }, [query.data, query.isLoading, setUser, setLoading]);

  return query;
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credential: string) =>
      api.post<TokenResponse>("/auth/google", { token: credential }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/");
    },
  });
}

export function useAppLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.post<TokenResponse>("/auth/dev-login", { username, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        return api.post("/auth/logout", { refresh_token: refreshToken });
      }
      return Promise.resolve();
    },
    onSettled: () => {
      clearTokens();
      logout();
      queryClient.clear();
      router.push("/login");
    },
  });
}
