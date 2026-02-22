"use client";

import { useEffect, useState, use } from "react";
import { Plus, Save, Send, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/forms/section-card";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import {
  useForm,
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useUpdateForm,
  usePublishForm,
} from "@/hooks/use-forms";
import type { Question, QuestionType, Section } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import Link from "next/link";

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = use(params);

  const { data: form } = useForm(formId);
  const { data: sections } = useSections(formId);

  const store = useFormBuilderStore();
  const updateForm = useUpdateForm();
  const publishFormMutation = usePublishForm();

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    if (form) {
      setFormTitle(form.title);
      setFormDesc(form.description ?? "");
      setFormDirty(false);
    }
  }, [form]);
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const createQuestion = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    store.setFormId(formId);
  }, [formId]);

  useEffect(() => {
    if (sections) {
      store.setSections(sections);
    }
  }, [sections]);

  const handleAddSection = () => {
    createSection.mutate(
      { formId, title: `Section ${store.sections.length + 1}` },
      {
        onSuccess: () => toast.success("Section added"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    updateSection.mutate(
      { sectionId, formId, ...updates },
      { onError: (err) => toast.error(err.message) },
    );
  };

  const handleDeleteSection = (sectionId: string) => {
    deleteSection.mutate(
      { sectionId, formId },
      {
        onSuccess: () => toast.success("Section deleted"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleAddQuestion = (sectionId: string, type: QuestionType) => {
    createQuestion.mutate(
      {
        sectionId,
        formId,
        question_type: type,
        text: "",
      },
      {
        onSuccess: () => toast.success("Question added"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
    updateQuestionMutation.mutate(
      { questionId, formId, ...updates },
      { onError: (err) => toast.error(err.message) },
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestionMutation.mutate(
      { questionId, formId },
      {
        onSuccess: () => toast.success("Question deleted"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleSaveForm = () => {
    updateForm.mutate(
      { formId, title: formTitle, description: formDesc || undefined },
      {
        onSuccess: () => {
          toast.success("Form saved");
          setFormDirty(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handlePublish = () => {
    publishFormMutation.mutate(formId, {
      onSuccess: () => toast.success("Form published"),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // TODO: implement reorder via API
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex-1">
            <Input
              value={formTitle}
              onChange={(e) => { setFormTitle(e.target.value); setFormDirty(true); }}
              className="text-2xl font-bold h-auto border-none shadow-none px-0 focus-visible:ring-0"
              placeholder="Form title..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={form.is_published ? "default" : "secondary"}>
              {form.is_published ? "Published" : "Draft"}
            </Badge>
            {form.is_composite && (
              <Badge variant="outline">Composite</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pl-12">
          <Input
            value={formDesc}
            onChange={(e) => { setFormDesc(e.target.value); setFormDirty(true); }}
            className="text-sm text-muted-foreground border-none shadow-none px-0 focus-visible:ring-0"
            placeholder="Add a description..."
          />

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={handleSaveForm} disabled={!formDirty || updateForm.isPending}>
              {updateForm.isPending ? (
                "Saving..."
              ) : formDirty ? (
                <><Save className="h-4 w-4 mr-2" />Save</>
              ) : (
                <><Check className="h-4 w-4 mr-2" />Saved</>
              )}
            </Button>
            {!form.is_published && (
              <Button onClick={handlePublish} variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground pl-12">
          Sections and questions are saved automatically when you click away from a field.
        </p>
      </div>

      {/* Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={store.sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {store.sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onUpdateSection={(updates) => handleUpdateSection(section.id, updates)}
                onDeleteSection={() => handleDeleteSection(section.id)}
                onAddQuestion={(type) => handleAddQuestion(section.id, type)}
                onUpdateQuestion={(qId, updates) => handleUpdateQuestion(qId, updates)}
                onDeleteQuestion={(qId) => handleDeleteQuestion(qId)}
                onReorderQuestions={() => {}}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {store.sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            This form has no sections yet. Add a section to start building.
          </p>
        </div>
      )}

      <Button onClick={handleAddSection} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>
    </div>
  );
}
