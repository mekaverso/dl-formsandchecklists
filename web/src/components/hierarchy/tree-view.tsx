"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { HierarchyNode } from "@/lib/types";

interface TreeViewProps {
  nodes: HierarchyNode[];
  onAdd: (parentId: string | null) => void;
  onEdit: (node: HierarchyNode) => void;
  onDelete: (node: HierarchyNode) => void;
}

export function TreeView({ nodes, onAdd, onEdit, onDelete }: TreeViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderTree className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No hierarchy defined</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Start by adding your first organizational node.
        </p>
        <Button onClick={() => onAdd(null)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Root Node
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: HierarchyNode;
  onAdd: (parentId: string | null) => void;
  onEdit: (node: HierarchyNode) => void;
  onDelete: (node: HierarchyNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent/50">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            {hasChildren ? (
              open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <span className="flex-1 text-sm font-medium">{node.name}</span>

        <Badge variant="secondary" className="text-xs shrink-0">
          {node.node_type}
        </Badge>

        <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onAdd(node.id)}
            title="Add child"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(node)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onDelete(node)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && (
        <CollapsibleContent className="ml-6 border-l pl-2">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
