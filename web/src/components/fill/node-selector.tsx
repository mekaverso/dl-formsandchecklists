"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useHierarchy } from "@/hooks/use-hierarchy";
import type { HierarchyNode } from "@/lib/types";

interface NodeSelectorProps {
  onSelect: (nodeId: string, nodeName: string) => void;
}

function flattenNodes(nodes: HierarchyNode[]): HierarchyNode[] {
  const flat: HierarchyNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    if (node.children) {
      flat.push(...flattenNodes(node.children));
    }
  }
  return flat;
}

function getPathLabel(node: HierarchyNode, allNodes: HierarchyNode[]): string {
  // Use materialized_path segments to build breadcrumbs
  const pathIds = node.materialized_path
    .split("/")
    .filter(Boolean);

  // Build label from depth-based indent if we can't resolve names
  const segments: string[] = [];
  for (const id of pathIds) {
    const found = allNodes.find((n) => n.id === id);
    if (found && found.id !== node.id) {
      segments.push(found.name);
    }
  }
  return segments.length > 0 ? segments.join(" > ") : "";
}

export function NodeSelector({ onSelect }: NodeSelectorProps) {
  const { data: nodes, isLoading } = useHierarchy();
  const [search, setSearch] = useState("");

  const flatNodes = useMemo(() => {
    if (!nodes) return [];
    return flattenNodes(nodes).sort(
      (a, b) => a.materialized_path.localeCompare(b.materialized_path),
    );
  }, [nodes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return flatNodes;
    const q = search.toLowerCase();
    return flatNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.node_type.toLowerCase().includes(q),
    );
  }, [flatNodes, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        <span className="text-sm">Loading locations...</span>
      </div>
    );
  }

  if (flatNodes.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
        <MapPin className="h-8 w-8 mb-2" />
        <p className="text-sm">No locations configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-1.5 max-h-[60vh] overflow-auto">
        {filtered.map((node) => {
          const pathLabel = getPathLabel(node, flatNodes);
          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id, node.name)}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors active:bg-accent"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{node.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {pathLabel ? `${pathLabel} · ` : ""}
                  {node.node_type}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No matching locations.
          </p>
        )}
      </div>
    </div>
  );
}
