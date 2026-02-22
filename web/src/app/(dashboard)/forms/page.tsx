"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Copy, Trash2, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForms, useCreateForm, usePublishForm, useDuplicateForm, useDeleteForm } from "@/hooks/use-forms";
import { toast } from "sonner";
import type { Form } from "@/lib/types";

export default function FormsPage() {
  const router = useRouter();
  const { data, isLoading } = useForms();
  const createForm = useCreateForm();
  const publishForm = usePublishForm();
  const duplicateForm = useDuplicateForm();
  const deleteForm = useDeleteForm();

  const [createOpen, setCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", description: "", code: "", is_composite: false });
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.mutate(newForm, {
      onSuccess: (form) => {
        toast.success("Form created");
        setCreateOpen(false);
        setNewForm({ title: "", description: "", code: "", is_composite: false });
        router.push(`/forms/${form.id}`);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handlePublish = (formId: string) => {
    publishForm.mutate(formId, {
      onSuccess: () => toast.success("Form published"),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDuplicate = (formId: string) => {
    duplicateForm.mutate(formId, {
      onSuccess: () => toast.success("Form duplicated"),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteForm.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Form deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const forms = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forms</h1>
          <p className="text-muted-foreground">
            Create and manage data collection forms.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading forms...</p>
          ) : forms.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No forms yet. Create your first form to start collecting data.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <Link
                        href={`/forms/${form.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {form.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {form.code || "—"}
                    </TableCell>
                    <TableCell>v{form.version}</TableCell>
                    <TableCell>
                      <Badge variant={form.is_published ? "default" : "secondary"}>
                        {form.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {form.is_composite && (
                        <Badge variant="outline">Composite</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(form.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/forms/${form.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {!form.is_published && (
                            <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(form)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Form Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Form</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Daily Equipment Inspection"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code (optional)</Label>
              <Input
                id="code"
                value={newForm.code}
                onChange={(e) => setNewForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g., DEI-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <Textarea
                id="desc"
                value={newForm.description}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="composite"
                checked={newForm.is_composite}
                onCheckedChange={(c) => setNewForm((f) => ({ ...f, is_composite: c }))}
              />
              <Label htmlFor="composite">Composite form (composed of other forms)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createForm.isPending}>
                {createForm.isPending ? "Creating..." : "Create Form"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this form, all its sections and questions.
              Existing responses will be preserved but disconnected.
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
