"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/fill/mobile-header";
import { ReviewSummary } from "@/components/fill/review-summary";
import { useFormWithSections, useUpsertAnswers, useSubmitResponse } from "@/hooks/use-fill";
import { useFormFillerStore } from "@/stores/form-filler-store";
import { toast } from "sonner";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const { formId, responseId } = use(params);
  const router = useRouter();

  const { data: form } = useFormWithSections(formId);
  const store = useFormFillerStore();
  const upsertAnswers = useUpsertAnswers();
  const submitResponse = useSubmitResponse();

  const handleSubmit = useCallback(() => {
    // First, flush all remaining dirty answers
    const dirty = store.getDirtyAnswers();
    const doSubmit = () => {
      submitResponse.mutate(responseId, {
        onSuccess: () => {
          toast.success("Response submitted!");
          store.reset();
          router.push("/fill");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      });
    };

    if (dirty.length > 0) {
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
            doSubmit();
          },
          onError: (err) => {
            toast.error(`Failed to save answers: ${err.message}`);
          },
        },
      );
    } else {
      doSubmit();
    }
  }, [responseId, store, upsertAnswers, submitResponse, router]);

  const isSubmitting = upsertAnswers.isPending || submitResponse.isPending;

  if (store.sections.length === 0) {
    return (
      <>
        <MobileHeader title="Review" showBack />
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title="Review Answers" showBack />

      <div className="p-4 space-y-4">
        {form && (
          <div>
            <h1 className="text-lg font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-sm text-muted-foreground">{form.description}</p>
            )}
          </div>
        )}

        <ReviewSummary sections={store.sections} answers={store.answers} />
      </div>

      <div className="sticky bottom-14 border-t bg-background p-3 flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Submit
            </>
          )}
        </Button>
      </div>
    </>
  );
}
