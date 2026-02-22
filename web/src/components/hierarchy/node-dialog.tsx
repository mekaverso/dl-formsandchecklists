"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HierarchyNode, NodeType } from "@/lib/types";

interface NodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: HierarchyNode | null;
  parentId: string | null;
  nodeTypes: NodeType[];
  onSave: (data: { name: string; node_type: string; description: string; parent_id: string | null }) => void;
  isLoading: boolean;
}

export function NodeDialog({
  open,
  onOpenChange,
  node,
  parentId,
  nodeTypes,
  onSave,
  isLoading,
}: NodeDialogProps) {
  const [name, setName] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (node) {
      setName(node.name);
      setNodeType(node.node_type);
      setDescription(node.description ?? "");
    } else {
      setName("");
      setNodeType(nodeTypes[0]?.name ?? "");
      setDescription("");
    }
  }, [node, nodeTypes, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      node_type: nodeType,
      description,
      parent_id: node ? node.parent_id : parentId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{node ? "Edit Node" : "Add Node"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Factory A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="node_type">Type</Label>
            <Select value={nodeType} onValueChange={setNodeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes.map((nt) => (
                  <SelectItem key={nt.id} value={nt.name}>
                    {nt.name}
                  </SelectItem>
                ))}
                {nodeTypes.length === 0 && (
                  <SelectItem value="default" disabled>
                    No types configured
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name || !nodeType}>
              {isLoading ? "Saving..." : node ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
