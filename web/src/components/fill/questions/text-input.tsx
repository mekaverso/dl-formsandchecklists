"use client";

import { Textarea } from "@/components/ui/textarea";

interface TextInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function TextInput({ value, onChange }: TextInputProps) {
  const text = (value?.text as string) ?? "";

  return (
    <Textarea
      value={text}
      onChange={(e) =>
        onChange(e.target.value ? { text: e.target.value } : null)
      }
      placeholder="Type your answer..."
      rows={3}
      className="text-base"
    />
  );
}
