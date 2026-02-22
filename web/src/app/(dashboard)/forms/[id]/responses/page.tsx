"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
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
import { useForm } from "@/hooks/use-forms";
import { useResponses } from "@/hooks/use-responses";
import { RESPONSE_STATUS_LABELS } from "@/lib/constants";
import type { ResponseStatus } from "@/lib/types";

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

export default function FormResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = use(params);
  const { data: form } = useForm(formId);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useResponses(page, 20, formId);

  const responses = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/forms/${formId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Responses: {form?.title ?? "..."}</h1>
          <p className="text-muted-foreground">
            All responses submitted for this form.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Responses ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : responses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No responses for this form yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => {
                  const StatusIcon = statusIcons[response.status];
                  return (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">
                        {response.respondent_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {response.node_name ?? "—"}
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
                          ? new Date(response.submitted_at).toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
