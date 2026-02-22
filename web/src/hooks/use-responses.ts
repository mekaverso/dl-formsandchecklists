"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { FormResponse, PagedResponse } from "@/lib/types";

export function useResponses(page = 1, perPage = 20, formId?: string) {
  const orgId = useAuthStore((s) => s.currentOrgId);

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (formId) params.set("form_id", formId);

  return useQuery({
    queryKey: ["responses", orgId, page, perPage, formId],
    queryFn: async () => {
      const responses = await api.get<FormResponse[]>(
        `/organizations/${orgId}/responses?${params}`,
      );
      return { items: responses, total: responses.length, page, per_page: perPage, pages: 1 } as PagedResponse<FormResponse>;
    },
    enabled: !!orgId,
  });
}

export function useResponse(responseId: string | null) {
  return useQuery({
    queryKey: ["response", responseId],
    queryFn: () => api.get<FormResponse>(`/responses/${responseId}`),
    enabled: !!responseId,
  });
}
