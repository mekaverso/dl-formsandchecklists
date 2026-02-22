"use client";

import { cn } from "@/lib/utils";

interface BooleanToggleProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function BooleanToggle({ value, onChange }: BooleanToggleProps) {
  const selected = value?.boolean as boolean | undefined;

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange({ boolean: true })}
        className={cn(
          "flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-colors",
          selected === true
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground active:bg-accent",
        )}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange({ boolean: false })}
        className={cn(
          "flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-colors",
          selected === false
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border text-muted-foreground active:bg-accent",
        )}
      >
        No
      </button>
    </div>
  );
}
