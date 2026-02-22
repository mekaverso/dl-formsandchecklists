"use client";

import { use, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/fill/mobile-header";
import { SectionProgress } from "@/components/fill/section-progress";
import { QuestionCard } from "@/components/fill/question-card";
import { useFormWithSections, useFormSections, useUpsertAnswers, useResponseDetail } from "@/hooks/use-fill";
import { useFormFillerStore } from "@/stores/form-filler-store";
import { toast } from "sonner";

export default function FillFormPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const { formId, responseId } = use(params);
  const router = useRouter();

  const { data: form } = useFormWithSections(formId);
  const { data: sections } = useFormSections(formId);
  const { data: responseDetail } = useResponseDetail(responseId);

  const store = useFormFillerStore();
  const upsertAnswers = useUpsertAnswers();
  const initialized = useRef(false);

  // Initialize store when data is ready
  useEffect(() => {
    if (sections && !initialized.current) {
      const existingAnswers = responseDetail?.answers ?? [];
      store.initialize(responseId, formId, sections, existingAnswers);
      initialized.current = true;
    }
  }, [sections, responseDetail]);

  // Auto-save dirty answers every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      flushDirtyAnswers();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const flushDirtyAnswers = useCallback(() => {
    const dirty = store.getDirtyAnswers();
    if (dirty.length === 0) return;

    const payload = dirty.map((a) => ({
      question_id: a.question_id,
      value: a.value,
      comment: a.comment,
      client_created_at: new Date().toISOString(),
    }));

    upsertAnswers.mutate(
      { responseId, answers: payload },
      {
        onSuccess: () => {
          store.markSynced(dirty.map((a) => a.question_id));
        },
        onError: (err) => {
          toast.error(`Auto-save failed: ${err.message}`);
        },
      },
    );
  }, [responseId, upsertAnswers]);

  const currentSection = store.sections[store.currentSectionIndex];
  const questions = currentSection?.questions ?? [];
  const isLastSection = store.currentSectionIndex === store.sections.length - 1;
  const isFirstSection = store.currentSectionIndex === 0;

  // Track which questions have been answered
  const answeredQuestionIds = useMemo(() => {
    const set = new Set<string>();
    for (const [qId, draft] of Object.entries(store.answers)) {
      if (draft.value !== null) {
        set.add(qId);
      }
    }
    return set;
  }, [store.answers]);

  // Map section id -> question ids
  const sectionQuestionIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of store.sections) {
      map.set(
        s.id,
        (s.questions ?? []).map((q) => q.id),
      );
    }
    return map;
  }, [store.sections]);

  const handlePrev = () => {
    flushDirtyAnswers();
    store.prevSection();
  };

  const handleNext = () => {
    flushDirtyAnswers();
    if (isLastSection) {
      router.push(`/fill/forms/${formId}/respond/${responseId}/review`);
    } else {
      store.nextSection();
    }
  };

  if (!form || store.sections.length === 0) {
    return (
      <>
        <MobileHeader title="Loading..." showBack />
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title={form.title} showBack />

      <SectionProgress
        sections={store.sections.map((s) => ({ id: s.id, title: s.title }))}
        currentIndex={store.currentSectionIndex}
        answeredQuestionIds={answeredQuestionIds}
        sectionQuestionIds={sectionQuestionIds}
        onNavigate={(idx) => {
          flushDirtyAnswers();
          store.goToSection(idx);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Section header */}
        <div>
          <h2 className="text-base font-semibold">{currentSection.title}</h2>
          {currentSection.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentSection.description}
            </p>
          )}
        </div>

        {/* Questions */}
        {questions.map((question, qIdx) => {
          const draft = store.answers[question.id];
          return (
            <QuestionCard
              key={question.id}
              question={question}
              index={qIdx}
              value={draft?.value ?? null}
              comment={draft?.comment ?? null}
              onValueChange={(val) => store.setAnswer(question.id, val)}
              onCommentChange={(comment) =>
                store.setComment(question.id, comment)
              }
            />
          );
        })}

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            This section has no questions.
          </p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-14 border-t bg-background p-3 flex gap-3">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstSection}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button onClick={handleNext} className="flex-1">
          {isLastSection ? "Review" : "Next"}
          {!isLastSection && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </>
  );
}
