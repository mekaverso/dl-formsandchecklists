"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ActionPlan, ActionPlanComment, PagedResponse, ActionPlanStatus, ActionPlanPriority } from "@/lib/types";

export function useActionPlans(page = 1, perPage = 20) {
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ["action-plans", orgId, page, perPage],
    queryFn: () =>
      api.get<PagedResponse<ActionPlan>>(
        `/organizations/${orgId}/action-plans?page=${page}&per_page=${perPage}`,
      ),
    enabled: !!orgId,
  });
}

export function useActionPlan(planId: string | null) {
  return useQuery({
    queryKey: ["action-plan", planId],
    queryFn: () => api.get<ActionPlan>(`/action-plans/${planId}`),
    enabled: !!planId,
  });
}

export function useUpdateActionPlan() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: ({
      planId,
      ...data
    }: {
      planId: string;
      title?: string;
      description?: string;
      root_cause?: string;
      priority?: ActionPlanPriority;
      status?: ActionPlanStatus;
      responsible_user_id?: string;
      deadline?: string;
    }) => api.put<ActionPlan>(`/action-plans/${planId}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["action-plans", orgId] });
      qc.invalidateQueries({ queryKey: ["action-plan", vars.planId] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, comment }: { planId: string; comment: string }) =>
      api.post<ActionPlanComment>(`/action-plans/${planId}/comments`, { comment }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["action-plan", vars.planId] }),
  });
}
