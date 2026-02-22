"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Form, FormResponse, Answer, Section } from "@/lib/types";

// ─── Forms ───────────────────────────────────────────────

export function usePublishedForms() {
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ["published-forms", orgId],
    queryFn: () => api.get<Form[]>(`/organizations/${orgId}/forms`),
    enabled: !!orgId,
    select: (forms) => forms.filter((f) => f.is_published),
  });
}

export function useFormWithSections(formId: string | null) {
  return useQuery({
    queryKey: ["form", formId],
    queryFn: () => api.get<Form>(`/forms/${formId}`),
    enabled: !!formId,
  });
}

export function useFormSections(formId: string | null) {
  return useQuery({
    queryKey: ["sections", formId],
    queryFn: () => api.get<Section[]>(`/forms/${formId}/sections`),
    enabled: !!formId,
  });
}

// ─── Responses ───────────────────────────────────────────

export function useCreateResponse() {
  return useMutation({
    mutationFn: ({
      formId,
      ...data
    }: {
      formId: string;
      node_id: string;
      device_id?: string;
      client_created_at: string;
    }) => api.post<FormResponse>(`/forms/${formId}/responses`, data),
  });
}

export function useUpsertAnswers() {
  return useMutation({
    mutationFn: ({
      responseId,
      answers,
    }: {
      responseId: string;
      answers: {
        question_id: string;
        value: Record<string, unknown> | null;
        comment?: string | null;
        client_created_at: string;
      }[];
    }) => api.put<Answer[]>(`/responses/${responseId}/answers`, answers),
  });
}

export function useSubmitResponse() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.currentOrgId);

  return useMutation({
    mutationFn: (responseId: string) =>
      api.post<FormResponse>(`/responses/${responseId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-responses", orgId] });
    },
  });
}

export function useResponseDetail(responseId: string | null) {
  return useQuery({
    queryKey: ["response", responseId],
    queryFn: () =>
      api.get<FormResponse & { answers: Answer[] }>(`/responses/${responseId}`),
    enabled: !!responseId,
  });
}

// ─── History ─────────────────────────────────────────────

export function useMyResponses() {
  const orgId = useAuthStore((s) => s.currentOrgId);
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["my-responses", orgId, userId],
    queryFn: () =>
      api.get<FormResponse[]>(
        `/organizations/${orgId}/responses?respondent_id=${userId}`,
      ),
    enabled: !!orgId && !!userId,
  });
}

// ─── File Uploads ────────────────────────────────────────

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: ({
      answerId,
      file_name,
      content_type,
    }: {
      answerId: string;
      file_name: string;
      content_type: string;
    }) =>
      api.post<{ upload_url: string; file_key: string }>(
        `/answers/${answerId}/attachments/upload-url`,
        { file_name, content_type },
      ),
  });
}
