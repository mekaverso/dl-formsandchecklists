"use client";

import { useState } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { Question } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

export function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [localText, setLocalText] = useState(question.text);
  const [localDesc, setLocalDesc] = useState(question.description ?? "");

  // Sync local state when question changes from server
  const [prevId, setPrevId] = useState(question.id);
  if (question.id !== prevId) {
    setPrevId(question.id);
    setLocalText(question.text);
    setLocalDesc(question.description ?? "");
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="border-l-4 border-l-primary/20">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{localText || "Untitled Question"}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {QUESTION_TYPE_LABELS[question.question_type]}
              </Badge>
              {question.is_required && (
                <Badge variant="secondary" className="text-xs shrink-0">Required</Badge>
              )}
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={() => { if (localText !== question.text) onUpdate({ text: localText }); }}
                placeholder="Enter the question..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
                onBlur={() => { const val = localDesc || null; if (val !== question.description) onUpdate({ description: val }); }}
                placeholder="Help text for the respondent..."
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.is_required}
                  onCheckedChange={(c) => onUpdate({ is_required: c })}
                />
                <Label className="text-sm">Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.requires_photo}
                  onCheckedChange={(c) => onUpdate({ requires_photo: c })}
                />
                <Label className="text-sm">Requires Photo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.requires_comment}
                  onCheckedChange={(c) => onUpdate({ requires_comment: c })}
                />
                <Label className="text-sm">Requires Comment</Label>
              </div>
            </div>

            {(question.question_type === "single_choice" || question.question_type === "multi_choice") && (
              <ChoiceOptionsEditor
                options={(question.config as { options?: { id: string; label: string; value: string }[] }).options ?? []}
                onChange={(options) =>
                  onUpdate({ config: { ...question.config, options } })
                }
              />
            )}

            {question.question_type === "numeric" && (
              <NumericConfigEditor
                config={question.config as { min?: number; max?: number; unit?: string; decimal_places?: number }}
                onChange={(updates) =>
                  onUpdate({ config: { ...question.config, ...updates } })
                }
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ChoiceOptionsEditor({
  options,
  onChange,
}: {
  options: { id: string; label: string; value: string }[];
  onChange: (options: { id: string; label: string; value: string }[]) => void;
}) {
  const [localOptions, setLocalOptions] = useState(options);

  // Sync when options change from server
  const [prevLen, setPrevLen] = useState(options.length);
  if (options.length !== prevLen) {
    setPrevLen(options.length);
    setLocalOptions(options);
  }

  const addOption = () => {
    const updated = [
      ...localOptions,
      { id: crypto.randomUUID(), label: "", value: "" },
    ];
    setLocalOptions(updated);
    onChange(updated);
  };

  const updateOption = (index: number, label: string) => {
    const updated = [...localOptions];
    updated[index] = { ...updated[index], label, value: label.toLowerCase().replace(/\s+/g, "_") };
    setLocalOptions(updated);
  };

  const commitOptions = () => {
    onChange(localOptions);
  };

  const removeOption = (index: number) => {
    const updated = localOptions.filter((_, i) => i !== index);
    setLocalOptions(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      {localOptions.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <Input
            value={opt.label}
            onChange={(e) => updateOption(i, e.target.value)}
            onBlur={commitOptions}
            placeholder={`Option ${i + 1}`}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => removeOption(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption}>
        Add Option
      </Button>
    </div>
  );
}

function NumericConfigEditor({
  config,
  onChange,
}: {
  config: { min?: number; max?: number; unit?: string; decimal_places?: number };
  onChange: (updates: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState({
    min: config.min ?? "",
    max: config.max ?? "",
    unit: config.unit ?? "",
    decimal_places: config.decimal_places ?? "",
  });

  const commit = () => {
    onChange({
      min: local.min !== "" ? Number(local.min) : undefined,
      max: local.max !== "" ? Number(local.max) : undefined,
      unit: local.unit || undefined,
      decimal_places: local.decimal_places !== "" ? Number(local.decimal_places) : undefined,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Min</Label>
        <Input
          type="number"
          value={local.min}
          onChange={(e) => setLocal((s) => ({ ...s, min: e.target.value }))}
          onBlur={commit}
          placeholder="No min"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Max</Label>
        <Input
          type="number"
          value={local.max}
          onChange={(e) => setLocal((s) => ({ ...s, max: e.target.value }))}
          onBlur={commit}
          placeholder="No max"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Unit</Label>
        <Input
          value={local.unit}
          onChange={(e) => setLocal((s) => ({ ...s, unit: e.target.value }))}
          onBlur={commit}
          placeholder="e.g., PSI, kg"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Decimal Places</Label>
        <Input
          type="number"
          min={0}
          max={10}
          value={local.decimal_places}
          onChange={(e) => setLocal((s) => ({ ...s, decimal_places: e.target.value }))}
          onBlur={commit}
          placeholder="0"
        />
      </div>
    </div>
  );
}
