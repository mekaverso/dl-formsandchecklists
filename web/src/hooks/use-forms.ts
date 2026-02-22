"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Form, Section, Question, PagedResponse } from "@/lib/types";

export function useForms(page = 1, perPage = 20) {
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ["forms", orgId, page, perPage],
    queryFn: async () => {
      const forms = await api.get<Form[]>(
        `/organizations/${orgId}/forms?page=${page}&per_page=${perPage}`,
      );
      return { items: forms, total: forms.length, page, per_page: perPage, pages: 1 } as PagedResponse<Form>;
    },
    enabled: !!orgId,
  });
}

export function useForm(formId: string | null) {
  return useQuery({
    queryKey: ["form", formId],
    queryFn: () => api.get<Form>(`/forms/${formId}`),
    enabled: !!formId,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (data: { title: string; description?: string; code?: string; is_composite?: boolean; expected_frequency?: string }) =>
      api.post<Form>(`/organizations/${orgId}/forms`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", orgId] }),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: ({ formId, ...data }: { formId: string; title?: string; description?: string; code?: string; expected_frequency?: string }) =>
      api.put<Form>(`/forms/${formId}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["forms", orgId] });
      qc.invalidateQueries({ queryKey: ["form", vars.formId] });
    },
  });
}

export function usePublishForm() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (formId: string) => api.post<Form>(`/forms/${formId}/publish`),
    onSuccess: (_, formId) => {
      qc.invalidateQueries({ queryKey: ["forms", orgId] });
      qc.invalidateQueries({ queryKey: ["form", formId] });
    },
  });
}

export function useDuplicateForm() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (formId: string) => api.post<Form>(`/forms/${formId}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", orgId] }),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (formId: string) => api.delete(`/forms/${formId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", orgId] }),
  });
}

// ─── Sections ────────────────────────────────────────────

export function useSections(formId: string | null) {
  return useQuery({
    queryKey: ["sections", formId],
    queryFn: () => api.get<Section[]>(`/forms/${formId}/sections`),
    enabled: !!formId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, ...data }: { formId: string; title: string; description?: string }) =>
      api.post<Section>(`/forms/${formId}/sections`, data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sections", vars.formId] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, formId, ...data }: { sectionId: string; formId: string; title?: string; description?: string | null }) =>
      api.put<Section>(`/sections/${sectionId}`, data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sections", vars.formId] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, formId }: { sectionId: string; formId: string }) =>
      api.delete(`/sections/${sectionId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sections", vars.formId] }),
  });
}

// ─── Questions ───────────────────────────────────────────

export function useCreateQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      formId,
      ...data
    }: {
      sectionId: string;
      formId: string;
      question_type: string;
      text: string;
      description?: string;
      is_required?: boolean;
      config?: Record<string, unknown>;
      reference_value?: Record<string, unknown>;
    }) => api.post<Question>(`/sections/${sectionId}/questions`, data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sections", vars.formId] }),
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      formId,
      ...data
    }: {
      questionId: string;
      formId: string;
      text?: string;
      description?: string | null;
      is_required?: boolean;
      requires_photo?: boolean;
      requires_comment?: boolean;
      config?: Record<string, unknown>;
      reference_value?: Record<string, unknown> | null;
    }) => api.put<Question>(`/questions/${questionId}`, data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sections", vars.formId] }),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, formId }: { questionId: string; formId: string }) =>
      api.delete(`/questions/${questionId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sections", vars.formId] }),
  });
}
