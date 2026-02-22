"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Form } from "@/lib/types";

interface FormListCardProps {
  form: Form;
  onClick: () => void;
}

export function FormListCard({ form, onClick }: FormListCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors active:bg-accent"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{form.title}</p>
        {form.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {form.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {form.code && (
            <Badge variant="outline" className="text-xs">
              {form.code}
            </Badge>
          )}
          {form.expected_frequency && (
            <span className="text-xs text-muted-foreground capitalize">
              {form.expected_frequency}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </button>
  );
}
