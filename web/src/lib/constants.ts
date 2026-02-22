import type { QuestionType, UserRole, ActionPlanStatus, ActionPlanPriority, ResponseStatus } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  supervisor: "Supervisor",
  end_user: "End User",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  numeric: "Numeric",
  text: "Text",
  date: "Date",
  boolean: "Yes / No",
  single_choice: "Single Choice",
  multi_choice: "Multiple Choice",
  photo: "Photo",
  barcode: "Barcode",
  qr_code: "QR Code",
  nfc: "NFC",
  signature: "Signature",
  file_attachment: "File Attachment",
};

export const ACTION_PLAN_STATUS_LABELS: Record<ActionPlanStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const ACTION_PLAN_PRIORITY_LABELS: Record<ActionPlanPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  numeric: "Hash",
  text: "Type",
  date: "Calendar",
  boolean: "ToggleLeft",
  single_choice: "CircleDot",
  multi_choice: "CheckSquare",
  photo: "Camera",
  barcode: "Barcode",
  qr_code: "QrCode",
  nfc: "Nfc",
  signature: "PenTool",
  file_attachment: "Paperclip",
};
