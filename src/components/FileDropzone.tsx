"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileArchive, FileUp, Upload } from "lucide-react";
import { acceptedBlueprintExtensions, formatBytes, maxSbcBytes, maxZipBytes } from "@/lib/file-validation";

type FileDropzoneProps = {
  isBusy: boolean;
  selectedFileName?: string;
  onFileSelected: (file: File) => void;
};

export function FileDropzone({
  isBusy,
  selectedFileName,
  onFileSelected,
}: Readonly<FileDropzoneProps>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const visibleFileName = selectedFileName?.trim();

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isBusy) {
      setIsDragOver(true);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files.item(0);

    if (file && !isBusy) {
      onFileSelected(file);
    }
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
          ? "rounded-lg border-2 border-cyan-700 bg-cyan-50 p-4 shadow-panel transition"
          : "rounded-lg border-2 border-dashed border-slate-300 bg-white p-4 shadow-panel transition"
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
          <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            {visibleFileName?.toLowerCase().endsWith(".zip") ? (
              <FileArchive aria-hidden="true" className="size-5" />
            ) : (
              <FileUp aria-hidden="true" className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">
              {visibleFileName || "Upload blueprint"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              bp.sbc or zipped blueprint folder · SBC {formatBytes(maxSbcBytes)} · ZIP{" "}
              {formatBytes(maxZipBytes)}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cyan-800 px-4 py-2.5 font-medium text-white transition hover:bg-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload aria-hidden="true" className="size-5" />
          <span>Select file</span>
        </button>
      </div>
    </div>
  );
}
