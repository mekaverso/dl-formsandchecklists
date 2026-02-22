"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { HierarchyNode, NodeType } from "@/lib/types";

function buildTree(flatNodes: HierarchyNode[]): HierarchyNode[] {
  const map = new Map<string, HierarchyNode>();
  const roots: HierarchyNode[] = [];

  for (const node of flatNodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function useHierarchy() {
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ["hierarchy", orgId],
    queryFn: () => api.get<HierarchyNode[]>(`/organizations/${orgId}/hierarchy`),
    enabled: !!orgId,
    select: buildTree,
  });
}

export function useNodeTypes() {
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ["node-types", orgId],
    queryFn: () => api.get<NodeType[]>(`/organizations/${orgId}/node-types`),
    enabled: !!orgId,
  });
}

export function useCreateNode() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (data: { parent_id: string | null; name: string; node_type: string; description?: string }) =>
      api.post<HierarchyNode>(`/organizations/${orgId}/nodes`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hierarchy", orgId] }),
  });
}

export function useUpdateNode() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: ({ nodeId, ...data }: { nodeId: string; name?: string; node_type?: string; description?: string }) =>
      api.put<HierarchyNode>(`/nodes/${nodeId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hierarchy", orgId] }),
  });
}

export function useDeleteNode() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (nodeId: string) => api.delete(`/nodes/${nodeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hierarchy", orgId] }),
  });
}

export function useMoveNode() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: ({ nodeId, newParentId }: { nodeId: string; newParentId: string | null }) =>
      api.put(`/nodes/${nodeId}/move`, { new_parent_id: newParentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hierarchy", orgId] }),
  });
}

export function useCreateNodeType() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (data: { name: string; depth_level: number; icon?: string }) =>
      api.post<NodeType>(`/organizations/${orgId}/node-types`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["node-types", orgId] }),
  });
}
