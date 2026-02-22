"use client";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { QuestionRenderer } from "./question-renderer";
import type { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  value: Record<string, unknown> | null;
  comment: string | null;
  onValueChange: (value: Record<string, unknown> | null) => void;
  onCommentChange: (comment: string) => void;
}

export function QuestionCard({
  question,
  index,
  value,
  comment,
  onValueChange,
  onCommentChange,
}: QuestionCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-xs text-muted-foreground mt-0.5">
            {index + 1}.
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">
              {question.text || "Untitled question"}
            </p>
            {question.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {question.description}
              </p>
            )}
          </div>
          {question.is_required && (
            <Badge variant="destructive" className="text-[10px] shrink-0">
              Required
            </Badge>
          )}
        </div>
      </div>

      <QuestionRenderer
        question={question}
        value={value}
        onChange={onValueChange}
      />

      {question.requires_comment && (
        <div>
          <label className="text-xs text-muted-foreground">Comment</label>
          <Textarea
            value={comment ?? ""}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="mt-1 text-sm"
          />
        </div>
      )}
    </div>
  );
}
