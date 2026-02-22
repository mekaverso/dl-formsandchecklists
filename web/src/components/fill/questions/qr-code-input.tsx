"use client";

import { Input } from "@/components/ui/input";
import { QrCode } from "lucide-react";

interface QrCodeInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function QrCodeInput({ value, onChange }: QrCodeInputProps) {
  const code = (value?.code as string) ?? "";

  return (
    <div className="relative">
      <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={code}
        onChange={(e) =>
          onChange(e.target.value ? { code: e.target.value } : null)
        }
        placeholder="Scan or type QR code value"
        className="pl-9 text-base"
      />
    </div>
  );
}
