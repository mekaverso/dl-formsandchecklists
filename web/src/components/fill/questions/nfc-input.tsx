"use client";

import { Input } from "@/components/ui/input";
import { Nfc } from "lucide-react";

interface NfcInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function NfcInput({ value, onChange }: NfcInputProps) {
  const tagId = (value?.tag_id as string) ?? "";

  return (
    <div className="relative">
      <Nfc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={tagId}
        onChange={(e) =>
          onChange(e.target.value ? { tag_id: e.target.value } : null)
        }
        placeholder="Enter NFC tag ID"
        className="pl-9 text-base"
      />
    </div>
  );
}
