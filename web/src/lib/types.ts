// ─── Enums ───────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "supervisor" | "end_user";

export type QuestionType =
  | "numeric"
  | "text"
  | "date"
  | "boolean"
  | "single_choice"
  | "multi_choice"
  | "photo"
  | "barcode"
  | "qr_code"
  | "nfc"
  | "signature"
  | "file_attachment";

export type ConformityStatus = "conforming" | "non_conforming" | "not_applicable";

export type ActionPlanStatus = "open" | "in_progress" | "completed" | "overdue" | "cancelled";

export type ActionPlanPriority = "low" | "medium" | "high" | "critical";

export type ResponseStatus = "draft" | "in_progress" | "submitted" | "approved" | "rejected";

export type FormFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "on_demand";

// ─── Models ──────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  google_sub: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  organizations: OrgMembership[];
}

export interface OrgMembership {
  organization_id: string;
  organization_name: string;
  role: UserRole;
}

export interface NodeType {
  id: string;
  organization_id: string;
  name: string;
  depth_level: number;
  icon: string | null;
  created_at: string;
}

export interface HierarchyNode {
  id: string;
  organization_id: string;
  parent_id: string | null;
  name: string;
  node_type: string;
  description: string | null;
  materialized_path: string;
  depth: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: HierarchyNode[];
}

export interface Member {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  node_assignments: { node_id: string; node_name: string }[];
}

export interface Form {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  code: string | null;
  version: number;
  is_composite: boolean;
  is_published: boolean;
  is_active: boolean;
  expected_frequency: FormFrequency | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  sections?: Section[];
}

export interface Section {
  id: string;
  form_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  section_id: string;
  question_type: QuestionType;
  text: string;
  description: string | null;
  is_required: boolean;
  requires_photo: boolean;
  requires_comment: boolean;
  sort_order: number;
  config: Record<string, unknown>;
  reference_value: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  node_id: string;
  respondent_id: string;
  parent_response_id: string | null;
  status: ResponseStatus;
  started_at: string;
  submitted_at: string | null;
  latitude: number | null;
  longitude: number | null;
  device_id: string | null;
  client_created_at: string;
  created_at: string;
  updated_at: string;
  form_title?: string;
  node_name?: string;
  respondent_name?: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value: unknown;
  comment: string | null;
  conformity_status: ConformityStatus | null;
  answered_at: string | null;
  question_text?: string;
  question_type?: QuestionType;
}

export interface ActionPlan {
  id: string;
  answer_id: string;
  response_id: string;
  organization_id: string;
  title: string;
  description: string;
  root_cause: string | null;
  priority: ActionPlanPriority;
  status: ActionPlanStatus;
  responsible_user_id: string | null;
  responsible_user_name?: string;
  deadline: string;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  comments?: ActionPlanComment[];
}

export interface ActionPlanComment {
  id: string;
  action_plan_id: string;
  user_id: string | null;
  user_name?: string;
  comment: string;
  created_at: string;
}

// ─── API Response Wrappers ───────────────────────────────

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
