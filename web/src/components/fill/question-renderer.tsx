"use client";

import type { Question } from "@/lib/types";
import { TextInput } from "./questions/text-input";
import { NumericInput } from "./questions/numeric-input";
import { DateInput } from "./questions/date-input";
import { BooleanToggle } from "./questions/boolean-toggle";
import { SingleChoiceRadio } from "./questions/single-choice-radio";
import { MultiChoiceCheckbox } from "./questions/multi-choice-checkbox";
import { PhotoCapture } from "./questions/photo-capture";
import { SignaturePad } from "./questions/signature-pad";
import { BarcodeInput } from "./questions/barcode-input";
import { QrCodeInput } from "./questions/qr-code-input";
import { NfcInput } from "./questions/nfc-input";
import { FileAttachmentInput } from "./questions/file-attachment-input";

interface QuestionRendererProps {
  question: Question;
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
}: QuestionRendererProps) {
  switch (question.question_type) {
    case "text":
      return <TextInput value={value} onChange={onChange} />;
    case "numeric":
      return (
        <NumericInput
          value={value}
          onChange={onChange}
          config={question.config}
        />
      );
    case "date":
      return <DateInput value={value} onChange={onChange} />;
    case "boolean":
      return <BooleanToggle value={value} onChange={onChange} />;
    case "single_choice":
      return (
        <SingleChoiceRadio
          value={value}
          onChange={onChange}
          config={question.config}
        />
      );
    case "multi_choice":
      return (
        <MultiChoiceCheckbox
          value={value}
          onChange={onChange}
          config={question.config}
        />
      );
    case "photo":
      return <PhotoCapture value={value} onChange={onChange} />;
    case "signature":
      return <SignaturePad value={value} onChange={onChange} />;
    case "barcode":
      return <BarcodeInput value={value} onChange={onChange} />;
    case "qr_code":
      return <QrCodeInput value={value} onChange={onChange} />;
    case "nfc":
      return <NfcInput value={value} onChange={onChange} />;
    case "file_attachment":
      return (
        <FileAttachmentInput
          value={value}
          onChange={onChange}
          config={question.config}
        />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unsupported question type: {question.question_type}
        </p>
      );
  }
}
