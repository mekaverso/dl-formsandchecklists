"use client";

import { cn } from "@/lib/utils";
import { Square, CheckSquare } from "lucide-react";

interface MultiChoiceCheckboxProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
  config: Record<string, unknown>;
}

interface ChoiceOption {
  id: string;
  label: string;
  value: string;
}

export function MultiChoiceCheckbox({
  value,
  onChange,
  config,
}: MultiChoiceCheckboxProps) {
  const options = (config.options as ChoiceOption[]) ?? [];
  const selected = ((value?.selected as string[]) ?? []);

  const toggle = (optId: string) => {
    const next = selected.includes(optId)
      ? selected.filter((id) => id !== optId)
      : [...selected, optId];
    onChange(next.length > 0 ? { selected: next } : null);
  };

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border active:bg-accent",
            )}
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <span className={isSelected ? "font-medium" : ""}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
