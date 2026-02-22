"use client";

import {
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  CircleDot,
  CheckSquare,
  Camera,
  ScanBarcode,
  QrCode,
  Nfc,
  PenTool,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { QuestionType } from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { useState } from "react";

const iconMap: Record<QuestionType, React.ElementType> = {
  numeric: Hash,
  text: Type,
  date: Calendar,
  boolean: ToggleLeft,
  single_choice: CircleDot,
  multi_choice: CheckSquare,
  photo: Camera,
  barcode: ScanBarcode,
  qr_code: QrCode,
  nfc: Nfc,
  signature: PenTool,
  file_attachment: Paperclip,
};

const categories = [
  {
    label: "Input",
    types: ["numeric", "text", "date", "boolean"] as QuestionType[],
  },
  {
    label: "Choice",
    types: ["single_choice", "multi_choice"] as QuestionType[],
  },
  {
    label: "Capture",
    types: ["photo", "barcode", "qr_code", "nfc", "signature", "file_attachment"] as QuestionType[],
  },
];

interface QuestionTypePickerProps {
  onSelect: (type: QuestionType) => void;
  children: React.ReactNode;
}

export function QuestionTypePicker({ onSelect, children }: QuestionTypePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.label}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {cat.label}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {cat.types.map((type) => {
                  const Icon = iconMap[type];
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 h-8 text-xs"
                      onClick={() => {
                        onSelect(type);
                        setOpen(false);
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {QUESTION_TYPE_LABELS[type]}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
