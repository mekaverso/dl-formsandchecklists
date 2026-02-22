import { create } from "zustand";
import type { Section, Question, QuestionType } from "@/lib/types";

interface FormBuilderState {
  formId: string | null;
  sections: Section[];
  activeSectionId: string | null;
  activeQuestionId: string | null;
  isDirty: boolean;

  setFormId: (id: string) => void;
  setSections: (sections: Section[]) => void;
  setActiveSectionId: (id: string | null) => void;
  setActiveQuestionId: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;

  addSection: (section: Section) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  removeSection: (id: string) => void;
  reorderSections: (from: number, to: number) => void;

  addQuestion: (sectionId: string, question: Question) => void;
  updateQuestion: (sectionId: string, questionId: string, updates: Partial<Question>) => void;
  removeQuestion: (sectionId: string, questionId: string) => void;
  reorderQuestions: (sectionId: string, from: number, to: number) => void;
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

export const useFormBuilderStore = create<FormBuilderState>((set) => ({
  formId: null,
  sections: [],
  activeSectionId: null,
  activeQuestionId: null,
  isDirty: false,

  setFormId: (formId) => set({ formId }),
  setSections: (sections) => set({ sections, isDirty: false }),
  setActiveSectionId: (activeSectionId) => set({ activeSectionId }),
  setActiveQuestionId: (activeQuestionId) => set({ activeQuestionId }),
  setDirty: (isDirty) => set({ isDirty }),

  addSection: (section) =>
    set((state) => ({
      sections: [...state.sections, section],
      isDirty: true,
    })),

  updateSection: (id, updates) =>
    set((state) => ({
      sections: state.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      isDirty: true,
    })),

  removeSection: (id) =>
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== id),
      isDirty: true,
    })),

  reorderSections: (from, to) =>
    set((state) => ({
      sections: reorder(state.sections, from, to),
      isDirty: true,
    })),

  addQuestion: (sectionId, question) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, questions: [...(s.questions ?? []), question] } : s,
      ),
      isDirty: true,
    })),

  updateQuestion: (sectionId, questionId, updates) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: (s.questions ?? []).map((q) =>
                q.id === questionId ? { ...q, ...updates } : q,
              ),
            }
          : s,
      ),
      isDirty: true,
    })),

  removeQuestion: (sectionId, questionId) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: (s.questions ?? []).filter((q) => q.id !== questionId) }
          : s,
      ),
      isDirty: true,
    })),

  reorderQuestions: (sectionId, from, to) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: reorder(s.questions ?? [], from, to) }
          : s,
      ),
      isDirty: true,
    })),
}));
