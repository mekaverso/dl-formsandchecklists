"use client";

import { cn } from "@/lib/utils";
import { Circle, CheckCircle2 } from "lucide-react";

interface SingleChoiceRadioProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
  config: Record<string, unknown>;
}

interface ChoiceOption {
  id: string;
  label: string;
  value: string;
}

export function SingleChoiceRadio({
  value,
  onChange,
  config,
}: SingleChoiceRadioProps) {
  const options = (config.options as ChoiceOption[]) ?? [];
  const selected = value?.selected as string | undefined;

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange({ selected: opt.id })}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border active:bg-accent",
            )}
          >
            {isSelected ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
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
