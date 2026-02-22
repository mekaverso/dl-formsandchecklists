"use client";

import { useState } from "react";
import { Eye, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResponses, useResponse } from "@/hooks/use-responses";
import { RESPONSE_STATUS_LABELS } from "@/lib/constants";
import type { FormResponse, ResponseStatus } from "@/lib/types";

const statusIcons: Record<ResponseStatus, React.ElementType> = {
  draft: Clock,
  in_progress: AlertCircle,
  submitted: CheckCircle,
  approved: CheckCircle,
  rejected: XCircle,
};

const statusColors: Record<ResponseStatus, string> = {
  draft: "text-muted-foreground",
  in_progress: "text-orange-500",
  submitted: "text-blue-500",
  approved: "text-green-500",
  rejected: "text-red-500",
};

export default function ResponsesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useResponses(page);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedResponse } = useResponse(selectedId);

  const responses = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Responses</h1>
        <p className="text-muted-foreground">
          View all form responses submitted by your team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Responses ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading responses...</p>
          ) : responses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No responses yet. Responses will appear here once team members submit forms.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => {
                    const StatusIcon = statusIcons[response.status];
                    return (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {response.form_title ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {response.node_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {response.respondent_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`h-4 w-4 ${statusColors[response.status]}`} />
                            <span className="text-sm">
                              {RESPONSE_STATUS_LABELS[response.status]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {response.submitted_at
                            ? new Date(response.submitted_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedId(response.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Response Details
              {selectedResponse && (
                <Badge variant="secondary" className="ml-2">
                  {RESPONSE_STATUS_LABELS[selectedResponse.status]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedResponse?.answers && selectedResponse.answers.length > 0 ? (
              <div className="space-y-4 pr-4">
                {selectedResponse.answers.map((answer) => (
                  <div key={answer.id} className="border rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium">{answer.question_text ?? "Question"}</p>
                    <p className="text-sm text-muted-foreground">
                      {answer.value !== null && answer.value !== undefined
                        ? typeof answer.value === "object"
                          ? JSON.stringify(answer.value)
                          : String(answer.value)
                        : "No answer"}
                    </p>
                    {answer.conformity_status && (
                      <Badge
                        variant={
                          answer.conformity_status === "conforming"
                            ? "default"
                            : answer.conformity_status === "non_conforming"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {answer.conformity_status.replace("_", " ")}
                      </Badge>
                    )}
                    {answer.comment && (
                      <p className="text-xs text-muted-foreground italic">
                        Comment: {answer.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No answer data available.
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
