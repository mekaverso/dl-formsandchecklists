"use client";

import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/fill/mobile-header";
import { useMyResponses } from "@/hooks/use-fill";
import type { ResponseStatus } from "@/lib/types";

const statusColors: Record<ResponseStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  in_progress: "outline",
  submitted: "default",
  approved: "default",
  rejected: "destructive",
};

export default function HistoryPage() {
  const { data: responses, isLoading } = useMyResponses();

  return (
    <>
      <MobileHeader title="History" />
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-sm">Loading history...</p>
          </div>
        ) : !responses || responses.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mb-3" />
            <p className="text-sm">No responses yet.</p>
            <p className="text-xs mt-1">
              Submitted forms will appear here.
            </p>
          </div>
        ) : (
          responses.map((resp) => (
            <Link
              key={resp.id}
              href={`/fill/history/${resp.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors active:bg-accent"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {resp.form_title ?? `Form response`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusColors[resp.status] ?? "secondary"} className="text-xs capitalize">
                    {resp.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(resp.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>
          ))
        )}
      </div>
    </>
  );
}
