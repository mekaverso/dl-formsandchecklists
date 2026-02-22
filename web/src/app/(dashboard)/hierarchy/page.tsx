"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TreeView } from "@/components/hierarchy/tree-view";
import { NodeDialog } from "@/components/hierarchy/node-dialog";
import {
  useHierarchy,
  useNodeTypes,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
} from "@/hooks/use-hierarchy";
import type { HierarchyNode } from "@/lib/types";
import { toast } from "sonner";

export default function HierarchyPage() {
  const { data: nodes = [], isLoading } = useHierarchy();
  const { data: nodeTypes = [] } = useNodeTypes();

  const createNode = useCreateNode();
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HierarchyNode | null>(null);

  const handleAdd = (pid: string | null) => {
    setEditingNode(null);
    setParentId(pid);
    setDialogOpen(true);
  };

  const handleEdit = (node: HierarchyNode) => {
    setEditingNode(node);
    setParentId(null);
    setDialogOpen(true);
  };

  const handleSave = (data: { name: string; node_type: string; description: string; parent_id: string | null }) => {
    if (editingNode) {
      updateNode.mutate(
        { nodeId: editingNode.id, name: data.name, node_type: data.node_type, description: data.description },
        {
          onSuccess: () => {
            toast.success("Node updated");
            setDialogOpen(false);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createNode.mutate(
        { parent_id: data.parent_id, name: data.name, node_type: data.node_type, description: data.description },
        {
          onSuccess: () => {
            toast.success("Node created");
            setDialogOpen(false);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteNode.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Node deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizational Hierarchy</h1>
          <p className="text-muted-foreground">
            Define your organization&apos;s structure: units, factories, areas, and more.
          </p>
        </div>
        <Button onClick={() => handleAdd(null)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Root Node
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Tree</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading hierarchy...</p>
          ) : (
            <TreeView
              nodes={nodes}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </CardContent>
      </Card>

      <NodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        node={editingNode}
        parentId={parentId}
        nodeTypes={nodeTypes}
        onSave={handleSave}
        isLoading={createNode.isPending || updateNode.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this node and all its descendants.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
