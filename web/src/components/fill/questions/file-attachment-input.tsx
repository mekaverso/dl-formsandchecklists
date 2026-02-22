"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";

interface FileAttachmentInputProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
  config: Record<string, unknown>;
}

export function FileAttachmentInput({
  value,
  onChange,
  config,
}: FileAttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = (value?.files as { file_name: string }[]) ?? [];
  const allowedExtensions = config.allowed_extensions as string[] | undefined;
  const accept = allowedExtensions?.join(",") ?? undefined;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles = [...files];
    for (const file of Array.from(fileList)) {
      newFiles.push({ file_name: file.name });
    }
    onChange({ files: newFiles });
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next.length > 0 ? { files: next } : null);
  };

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
            >
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{file.file_name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors active:bg-accent"
      >
        <Paperclip className="h-5 w-5" />
        Attach File
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
