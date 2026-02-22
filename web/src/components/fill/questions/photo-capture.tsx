"use client";

import { Camera } from "lucide-react";
import { useRef } from "react";

interface PhotoCaptureProps {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
}

export function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photos = (value?.photos as { file_name: string; preview?: string }[]) ?? [];

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newPhotos = [...photos];
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file_name: file.name, preview });
    }
    onChange({ photos: newPhotos });
  };

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((photo, i) => (
            <div key={i} className="relative shrink-0">
              {photo.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.preview}
                  alt={photo.file_name}
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg border flex items-center justify-center bg-muted">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors active:bg-accent"
      >
        <Camera className="h-5 w-5" />
        Take Photo or Upload
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
