"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/fill/mobile-header";
import { useFormWithSections, useFormSections, useCreateResponse } from "@/hooks/use-fill";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { toast } from "sonner";

export default function StartFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  const router = useRouter();
  const { data: form, isLoading } = useFormWithSections(formId);
  const { data: sections } = useFormSections(formId);
  const { data: nodes } = useHierarchy();
  const createResponse = useCreateResponse();

  const totalQuestions = (sections ?? []).reduce(
    (acc, s) => acc + (s.questions?.length ?? 0),
    0,
  );

  const handleStart = () => {
    // Use the first available hierarchy node
    // (In a full implementation, this would use form_node_assignments)
    const nodeId = nodes?.[0]?.id;
    if (!nodeId) {
      toast.error("No locations configured. Please set up the hierarchy first.");
      return;
    }

    createResponse.mutate(
      {
        formId,
        node_id: nodeId,
        client_created_at: new Date().toISOString(),
      },
      {
        onSuccess: (response) => {
          router.push(`/fill/forms/${formId}/respond/${response.id}`);
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <>
        <MobileHeader title="Loading..." showBack />
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  if (!form) {
    return (
      <>
        <MobileHeader title="Form not found" showBack />
        <div className="p-4 text-center text-muted-foreground">
          <p>This form could not be loaded.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title={form.title} showBack />
      <div className="p-4 space-y-6">
        {/* Form info */}
        <div className="space-y-2">
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {form.code && (
              <Badge variant="outline">{form.code}</Badge>
            )}
            {form.expected_frequency && (
              <Badge variant="secondary" className="capitalize">
                {form.expected_frequency}
              </Badge>
            )}
            <Badge variant="secondary">
              {sections?.length ?? 0} section{(sections?.length ?? 0) !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="secondary">
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Section preview */}
        {sections && sections.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Sections</h3>
            <div className="space-y-1.5">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 rounded border px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground w-5 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{section.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {section.questions?.length ?? 0} question{(section.questions?.length ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <Button
          onClick={handleStart}
          disabled={createResponse.isPending || !sections?.length}
          className="w-full h-12 text-base"
          size="lg"
        >
          {createResponse.isPending ? (
            "Starting..."
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Filling
            </>
          )}
        </Button>
      </div>
    </>
  );
}
