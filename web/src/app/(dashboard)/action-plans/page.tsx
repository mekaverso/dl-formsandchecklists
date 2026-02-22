"use client";

import { useState } from "react";
import { Eye, MessageSquare, Calendar, User, AlertTriangle } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useActionPlans, useActionPlan, useUpdateActionPlan, useAddComment } from "@/hooks/use-action-plans";
import { ACTION_PLAN_STATUS_LABELS, ACTION_PLAN_PRIORITY_LABELS } from "@/lib/constants";
import type { ActionPlanStatus, ActionPlanPriority } from "@/lib/types";
import { toast } from "sonner";

const priorityColors: Record<ActionPlanPriority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const statusColors: Record<ActionPlanStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  in_progress: "secondary",
  completed: "default",
  overdue: "destructive",
  cancelled: "outline",
};

export default function ActionPlansPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActionPlans(page);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedPlan } = useActionPlan(selectedId);
  const updatePlan = useUpdateActionPlan();
  const addComment = useAddComment();
  const [newComment, setNewComment] = useState("");

  const plans = data?.items ?? [];

  const handleStatusChange = (planId: string, status: ActionPlanStatus) => {
    updatePlan.mutate(
      { planId, status },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleAddComment = () => {
    if (!selectedId || !newComment.trim()) return;
    addComment.mutate(
      { planId: selectedId, comment: newComment.trim() },
      {
        onSuccess: () => {
          toast.success("Comment added");
          setNewComment("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Action Plans</h1>
        <p className="text-muted-foreground">
          Track corrective actions for non-conforming answers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Action Plans ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading action plans...</p>
          ) : plans.length === 0 ? (
            <div className="py-8 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No action plans yet. They are created automatically for non-conforming answers.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {plan.title}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[plan.priority]}`}>
                          {ACTION_PLAN_PRIORITY_LABELS[plan.priority]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[plan.status]}>
                          {ACTION_PLAN_STATUS_LABELS[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {plan.responsible_user_name ?? "Unassigned"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(plan.deadline).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedId(plan.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data && data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.title ?? "Action Plan"}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={selectedPlan.status}
                      onValueChange={(v) => handleStatusChange(selectedPlan.id, v as ActionPlanStatus)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ACTION_PLAN_STATUS_LABELS) as ActionPlanStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {ACTION_PLAN_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[selectedPlan.priority]}`}>
                        {ACTION_PLAN_PRIORITY_LABELS[selectedPlan.priority]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Deadline</Label>
                    <p className="text-sm flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedPlan.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Responsible</Label>
                    <p className="text-sm flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5" />
                      {selectedPlan.responsible_user_name ?? "Unassigned"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedPlan.description}</p>
                </div>

                {selectedPlan.root_cause && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Root Cause</Label>
                    <p className="text-sm mt-1">{selectedPlan.root_cause}</p>
                  </div>
                )}

                <Separator />

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({selectedPlan.comments?.length ?? 0})
                  </h4>

                  <div className="space-y-3">
                    {selectedPlan.comments?.map((c) => (
                      <div key={c.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{c.user_name ?? "System"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{c.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addComment.isPending}
                    >
                      {addComment.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
