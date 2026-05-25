"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileArchive, FileInput, FileUp } from "lucide-react";
import { acceptedBlueprintExtensions } from "@/lib/file-validation";

type FileDropzoneProps = {
  isBusy: boolean;
  selectedFileName?: string;
  displayName?: string;
  onFileSelected: (file: File) => void;
};

export function FileDropzone({
  isBusy,
  selectedFileName,
  displayName,
  onFileSelected,
}: Readonly<FileDropzoneProps>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const visibleFileName = selectedFileName?.trim();
  const visibleTitle = displayName?.trim() || visibleFileName;

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isBusy) {
      setIsDragOver(true);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.item(0);

    if (file) {
      onFileSelected(file);
    }

    event.currentTarget.value = "";
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={
        isDragOver
          ? "rounded-lg border-2 border-cyan-400 bg-cyan-950/50 p-4 shadow-panel transition"
          : "rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/90 p-4 shadow-panel transition"
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedBlueprintExtensions.join(",")}
        onChange={handleFileInput}
        className="sr-only"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
            {visibleFileName?.toLowerCase().endsWith(".zip") ? (
              <FileArchive aria-hidden="true" className="size-5" />
            ) : (
              <FileUp aria-hidden="true" className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-50">
              {visibleTitle || "Load blueprint"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Drop a bp.sbc or zipped blueprint folder anywhere in this window
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileInput aria-hidden="true" className="size-5" />
          <span>Select file</span>
        </button>
      </div>
    </div>
  );
}
