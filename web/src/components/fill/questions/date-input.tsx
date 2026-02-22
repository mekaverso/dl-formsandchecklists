"use client";

import { Input } from "@/components/ui/input";

interface DateInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  const date = (value?.date as string) ?? "";

  return (
    <Input
      type="date"
      value={date}
      onChange={(e) =>
        onChange(e.target.value ? { date: e.target.value } : null)
      }
      className="text-base"
    />
  );
}
