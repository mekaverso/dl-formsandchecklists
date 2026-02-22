"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Member, PagedResponse, UserRole } from "@/lib/types";

export function useMembers(page = 1, perPage = 50) {
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ["members", orgId, page, perPage],
    queryFn: () =>
      api.get<PagedResponse<Member>>(
        `/organizations/${orgId}/members?page=${page}&per_page=${perPage}`,
      ),
    enabled: !!orgId,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (data: { email: string; full_name: string; role: UserRole }) =>
      api.post<Member>(`/organizations/${orgId}/members`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.put(`/organizations/${orgId}/members/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}

export function useUpdateNodeAssignments() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: ({ userId, nodeIds }: { userId: string; nodeIds: string[] }) =>
      api.put(`/organizations/${orgId}/members/${userId}/node-assignments`, {
        node_ids: nodeIds,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/organizations/${orgId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}
