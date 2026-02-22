"use client";

import { Input } from "@/components/ui/input";

interface NumericInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
  config: Record<string, unknown>;
}

export function NumericInput({ value, onChange, config }: NumericInputProps) {
  const num = value?.number as number | undefined;
  const min = config.min as number | undefined;
  const max = config.max as number | undefined;
  const unit = config.unit as string | undefined;
  const decimalPlaces = config.decimal_places as number | undefined;
  const step = decimalPlaces !== undefined ? Math.pow(10, -decimalPlaces) : "any";

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        inputMode="decimal"
        value={num !== undefined ? String(num) : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onChange(null);
          } else {
            onChange({ number: parseFloat(v) });
          }
        }}
        min={min}
        max={max}
        step={step}
        placeholder={
          min !== undefined && max !== undefined
            ? `${min} – ${max}`
            : "Enter number"
        }
        className="text-base flex-1"
      />
      {unit && (
        <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
      )}
    </div>
  );
}
