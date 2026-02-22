"use client";

import { Input } from "@/components/ui/input";
import { ScanBarcode } from "lucide-react";

interface BarcodeInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function BarcodeInput({ value, onChange }: BarcodeInputProps) {
  const code = (value?.code as string) ?? "";

  return (
    <div className="relative">
      <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={code}
        onChange={(e) =>
          onChange(e.target.value ? { code: e.target.value } : null)
        }
        placeholder="Scan or type barcode value"
        className="pl-9 text-base"
      />
    </div>
  );
}
