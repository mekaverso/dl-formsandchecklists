"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SectionProgressProps {
  sections: { id: string; title: string }[];
  currentIndex: number;
  answeredQuestionIds: Set<string>;
  sectionQuestionIds: Map<string, string[]>;
  onNavigate: (index: number) => void;
}

export function SectionProgress({
  sections,
  currentIndex,
  answeredQuestionIds,
  sectionQuestionIds,
  onNavigate,
}: SectionProgressProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 scrollbar-none">
      {sections.map((section, idx) => {
        const questionIds = sectionQuestionIds.get(section.id) ?? [];
        const allAnswered =
          questionIds.length > 0 &&
          questionIds.every((qId) => answeredQuestionIds.has(qId));
        const isCurrent = idx === currentIndex;

        return (
          <button
            key={section.id}
            onClick={() => onNavigate(idx)}
            className={cn(
              "flex items-center justify-center shrink-0 rounded-full text-xs font-medium transition-colors",
              isCurrent
                ? "h-8 min-w-8 px-3 bg-primary text-primary-foreground"
                : allAnswered
                  ? "h-7 w-7 bg-primary/20 text-primary"
                  : "h-7 w-7 border bg-background text-muted-foreground",
            )}
            title={section.title}
          >
            {allAnswered && !isCurrent ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              idx + 1
            )}
          </button>
        );
      })}
    </div>
  );
}
