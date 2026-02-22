"use client";

import { Badge } from "@/components/ui/badge";
import type { Section, Question } from "@/lib/types";

interface AnswerDraft {
  question_id: string;
  value: Record<string, unknown> | null;
  comment: string | null;
}

interface ReviewSummaryProps {
  sections: Section[];
  answers: Record<string, AnswerDraft>;
}

function formatAnswer(question: Question, value: Record<string, unknown> | null): string {
  if (!value) return "—";

  switch (question.question_type) {
    case "text":
      return (value.text as string) || "—";
    case "numeric": {
      const num = value.number as number;
      const unit = question.config.unit as string | undefined;
      return num !== undefined ? `${num}${unit ? ` ${unit}` : ""}` : "—";
    }
    case "date":
      return (value.date as string) || "—";
    case "boolean":
      return value.boolean === true ? "Yes" : value.boolean === false ? "No" : "—";
    case "single_choice": {
      const options = (question.config.options as { id: string; label: string }[]) ?? [];
      const selected = value.selected as string;
      return options.find((o) => o.id === selected)?.label ?? selected ?? "—";
    }
    case "multi_choice": {
      const opts = (question.config.options as { id: string; label: string }[]) ?? [];
      const sel = (value.selected as string[]) ?? [];
      return sel.map((id) => opts.find((o) => o.id === id)?.label ?? id).join(", ") || "—";
    }
    case "photo": {
      const photos = (value.photos as unknown[]) ?? [];
      return photos.length > 0 ? `${photos.length} photo(s)` : "—";
    }
    case "signature":
      return value.signature_data ? "Signed" : "—";
    case "barcode":
    case "qr_code":
      return (value.code as string) || "—";
    case "nfc":
      return (value.tag_id as string) || "—";
    case "file_attachment": {
      const files = (value.files as unknown[]) ?? [];
      return files.length > 0 ? `${files.length} file(s)` : "—";
    }
    default:
      return JSON.stringify(value);
  }
}

export function ReviewSummary({ sections, answers }: ReviewSummaryProps) {
  let totalRequired = 0;
  let answeredRequired = 0;

  for (const section of sections) {
    for (const q of section.questions ?? []) {
      if (q.is_required) {
        totalRequired++;
        if (answers[q.id]?.value !== null && answers[q.id]?.value !== undefined) {
          answeredRequired++;
        }
      }
    }
  }

  const allAnswered = totalRequired === answeredRequired;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={allAnswered ? "default" : "destructive"}>
          {answeredRequired}/{totalRequired} required
        </Badge>
        {!allAnswered && (
          <span className="text-xs text-destructive">
            Some required questions are unanswered.
          </span>
        )}
      </div>

      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          <h3 className="text-sm font-semibold">{section.title}</h3>
          <div className="space-y-1.5">
            {(section.questions ?? []).map((q, idx) => {
              const draft = answers[q.id];
              const hasAnswer = draft?.value !== null && draft?.value !== undefined;
              return (
                <div
                  key={q.id}
                  className="flex items-start gap-2 rounded border px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {q.text || "Untitled"}
                      {q.is_required && !hasAnswer && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {formatAnswer(q, draft?.value ?? null)}
                    </p>
                    {draft?.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        &quot;{draft.comment}&quot;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
