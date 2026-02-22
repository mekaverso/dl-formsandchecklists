import { create } from "zustand";
import type { Section, Answer } from "@/lib/types";

interface AnswerDraft {
  question_id: string;
  value: Record<string, unknown> | null;
  comment: string | null;
  isDirty: boolean;
}

interface FormFillerState {
  responseId: string | null;
  formId: string | null;
  sections: Section[];
  currentSectionIndex: number;
  answers: Record<string, AnswerDraft>;

  initialize: (
    responseId: string,
    formId: string,
    sections: Section[],
    existingAnswers: Answer[],
  ) => void;
  setAnswer: (questionId: string, value: Record<string, unknown> | null) => void;
  setComment: (questionId: string, comment: string) => void;
  goToSection: (index: number) => void;
  nextSection: () => void;
  prevSection: () => void;
  markSynced: (questionIds: string[]) => void;
  getDirtyAnswers: () => AnswerDraft[];
  reset: () => void;
}

export const useFormFillerStore = create<FormFillerState>((set, get) => ({
  responseId: null,
  formId: null,
  sections: [],
  currentSectionIndex: 0,
  answers: {},

  initialize: (responseId, formId, sections, existingAnswers) => {
    const answers: Record<string, AnswerDraft> = {};
    for (const a of existingAnswers) {
      answers[a.question_id] = {
        question_id: a.question_id,
        value: (a.value as Record<string, unknown>) ?? null,
        comment: a.comment ?? null,
        isDirty: false,
      };
    }
    set({ responseId, formId, sections, currentSectionIndex: 0, answers });
  },

  setAnswer: (questionId, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          question_id: questionId,
          value,
          comment: state.answers[questionId]?.comment ?? null,
          isDirty: true,
        },
      },
    })),

  setComment: (questionId, comment) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          question_id: questionId,
          value: state.answers[questionId]?.value ?? null,
          comment,
          isDirty: true,
        },
      },
    })),

  goToSection: (index) => set({ currentSectionIndex: index }),

  nextSection: () =>
    set((state) => ({
      currentSectionIndex: Math.min(
        state.currentSectionIndex + 1,
        state.sections.length - 1,
      ),
    })),

  prevSection: () =>
    set((state) => ({
      currentSectionIndex: Math.max(state.currentSectionIndex - 1, 0),
    })),

  markSynced: (questionIds) =>
    set((state) => {
      const answers = { ...state.answers };
      for (const qId of questionIds) {
        if (answers[qId]) {
          answers[qId] = { ...answers[qId], isDirty: false };
        }
      }
      return { answers };
    }),

  getDirtyAnswers: () =>
    Object.values(get().answers).filter((a) => a.isDirty),

  reset: () =>
    set({
      responseId: null,
      formId: null,
      sections: [],
      currentSectionIndex: 0,
      answers: {},
    }),
}));
