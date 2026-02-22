"use client";

import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/fill/mobile-header";
import { useResponseDetail, useFormSections } from "@/hooks/use-fill";
import type { Question, Answer } from "@/lib/types";

function formatAnswerValue(answer: Answer, question?: Question): string {
  const value = answer.value as Record<string, unknown> | null;
  if (!value) return "—";

  const type = question?.question_type ?? answer.question_type;

  switch (type) {
    case "text":
      return (value.text as string) || "—";
    case "numeric": {
      const unit = question?.config?.unit as string | undefined;
      return value.number !== undefined ? `${value.number}${unit ? ` ${unit}` : ""}` : "—";
    }
    case "date":
      return (value.date as string) || "—";
    case "boolean":
      return value.boolean === true ? "Yes" : value.boolean === false ? "No" : "—";
    case "single_choice": {
      const opts = (question?.config?.options as { id: string; label: string }[]) ?? [];
      return opts.find((o) => o.id === value.selected)?.label ?? (value.selected as string) ?? "—";
    }
    case "multi_choice": {
      const opts2 = (question?.config?.options as { id: string; label: string }[]) ?? [];
      const sel = (value.selected as string[]) ?? [];
      return sel.map((id) => opts2.find((o) => o.id === id)?.label ?? id).join(", ") || "—";
    }
    case "photo":
      return `${((value.photos as unknown[]) ?? []).length} photo(s)`;
    case "signature":
      return value.signature_data ? "Signed" : "—";
    case "barcode":
    case "qr_code":
      return (value.code as string) || "—";
    case "nfc":
      return (value.tag_id as string) || "—";
    case "file_attachment":
      return `${((value.files as unknown[]) ?? []).length} file(s)`;
    default:
      return JSON.stringify(value);
  }
}

export default function ResponseDetailPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = use(params);
  const { data: response, isLoading } = useResponseDetail(responseId);
  const { data: sections } = useFormSections(response?.form_id ?? null);

  if (isLoading || !response) {
    return (
      <>
        <MobileHeader title="Response" showBack />
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  // Build a question map from sections if available
  const questionMap = new Map<string, Question>();
  if (sections) {
    for (const s of sections) {
      for (const q of s.questions ?? []) {
        questionMap.set(q.id, q);
      }
    }
  }

  const answers = response.answers ?? [];

  return (
    <>
      <MobileHeader title="Response Detail" showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="capitalize">
            {response.status.replace("_", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {response.submitted_at
              ? `Submitted ${new Date(response.submitted_at).toLocaleString()}`
              : `Created ${new Date(response.created_at).toLocaleString()}`}
          </span>
        </div>

        {sections ? (
          // Grouped by section
          sections.map((section) => {
            const sectionAnswers = answers.filter((a) =>
              (section.questions ?? []).some((q) => q.id === a.question_id),
            );
            if (sectionAnswers.length === 0) return null;

            return (
              <div key={section.id} className="space-y-2">
                <h3 className="text-sm font-semibold">{section.title}</h3>
                <div className="space-y-1.5">
                  {(section.questions ?? []).map((q, idx) => {
                    const answer = answers.find((a) => a.question_id === q.id);
                    if (!answer) return null;
                    return (
                      <div
                        key={q.id}
                        className="flex items-start gap-2 rounded border px-3 py-2"
                      >
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {q.text}
                          </p>
                          <p className="text-sm font-medium">
                            {formatAnswerValue(answer, q)}
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
                              className="text-[10px] mt-1"
                            >
                              {answer.conformity_status.replace("_", " ")}
                            </Badge>
                          )}
                          {answer.comment && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              &quot;{answer.comment}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Flat list when sections aren't loaded
          <div className="space-y-1.5">
            {answers.map((answer, idx) => {
              const q = questionMap.get(answer.question_id);
              return (
                <div
                  key={answer.id}
                  className="flex items-start gap-2 rounded border px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {answer.question_text ?? q?.text ?? "Question"}
                    </p>
                    <p className="text-sm font-medium">
                      {formatAnswerValue(answer, q)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
