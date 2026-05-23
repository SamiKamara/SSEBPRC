"use client";

import { DragEvent, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  FileJson,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { ResourceTable } from "@/components/ResourceTable";
import { ResultsSummary } from "@/components/ResultsSummary";
import { WarningPanel } from "@/components/WarningPanel";
import { calculationToJson } from "@/lib/export";
import { validateBlueprintFile } from "@/lib/file-validation";
import type { CalculateErrorResponse, CalculateResponse } from "@/lib/types";

type UploadState = "idle" | "validating" | "uploading" | "success" | "error";
type ResultTab = "ingots" | "components" | "blocks" | "warnings";
type ResultTabDefinition = {
  id: ResultTab;
  label: string;
  count: number;
};

const requestTimeoutMs = 45000;
const appTitle = "Shagatan's Space Engineers Blueprint Resource Calculator";

export function BlueprintResourceCalculator() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("ingots");
  const [isPageDragActive, setIsPageDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const tabs = useMemo(
    () => {
      const resultTabs: ResultTabDefinition[] = [
        { id: "ingots" as const, label: "Ingots", count: result?.ingots.length ?? 0 },
        {
          id: "components" as const,
          label: "Components",
          count: result?.components.length ?? 0,
        },
        { id: "blocks" as const, label: "Blocks", count: result?.blocks.length ?? 0 },
      ];

      if ((result?.warnings.length ?? 0) > 0) {
        resultTabs.push({
          id: "warnings" as const,
          label: "Warnings",
          count: result?.warnings.length ?? 0,
        });
      }

      return resultTabs;
    },
    [result],
  );

  const isBusy = uploadState === "validating" || uploadState === "uploading";

  const handlePageDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsPageDragActive(true);
  };

  const handlePageDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = isBusy ? "none" : "copy";
    setIsPageDragActive(true);
  };

  const handlePageDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsPageDragActive(false);
    }
  };

  const handlePageDrop = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsPageDragActive(false);

    const file = event.dataTransfer.files.item(0);

    if (file && !isBusy) {
      void handleFileSelected(file);
    }
  };

  const handleFileSelected = async (file: File) => {
    setUploadState("validating");
    setSelectedFileName(file.name);
    setError("");
    setResult(null);

    const validation = validateBlueprintFile(file);

    if (!validation.ok) {
      setUploadState("error");
      setError(validation.error);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    const formData = new FormData();
    formData.append("blueprint", file);
    setUploadState("uploading");

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = (await response.json()) as CalculateResponse | CalculateErrorResponse;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Calculation failed.");
      }

      setResult(data);
      setActiveTab("ingots");
      setUploadState("success");
    } catch (uploadError) {
      setUploadState("error");
      setError(getUploadErrorMessage(uploadError));
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const reset = () => {
    setUploadState("idle");
    setSelectedFileName("");
    setError("");
    setResult(null);
    setActiveTab("ingots");
  };

  const downloadJson = () => {
    if (!result) {
      return;
    }

    downloadText(`${resultFileBase(result)}.json`, calculationToJson(result), "application/json");
  };

  return (
    <main
      onDragEnter={handlePageDragEnter}
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
      className="relative min-h-screen px-4 py-5 text-slate-50 sm:px-6 lg:px-8"
    >
      {isPageDragActive ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center border-4 border-cyan-300 bg-cyan-950/70 text-center backdrop-blur-sm">
          <div className="rounded-md border border-cyan-300 bg-slate-950 px-6 py-5 shadow-panel">
            <p className="text-xl font-semibold text-slate-50">Drop blueprint to calculate</p>
            <p className="mt-1 text-sm text-slate-300">bp.sbc or zipped blueprint folder</p>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="border-b border-slate-800 pb-4">
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <h1
                aria-label={appTitle}
                className="flex flex-col gap-1 font-semibold tracking-normal"
              >
                <span className="text-3xl leading-tight text-slate-50 sm:text-4xl">
                  {"Shagatan's Space Engineers"}
                </span>
                <span className="text-xl leading-snug text-blue-300 sm:text-2xl">
                  Blueprint Resource Calculator
                </span>
              </h1>
            </div>
          </div>
        </header>

        <FileDropzone
          isBusy={isBusy}
          selectedFileName={selectedFileName}
          onFileSelected={(file) => void handleFileSelected(file)}
        />

        {isBusy ? (
          <div className="flex min-h-28 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-slate-200 shadow-sm">
            <Loader2 aria-hidden="true" className="mr-2 size-5 animate-spin text-cyan-300" />
            {uploadState === "validating" ? "Checking file" : "Calculating resources"}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-950/60 px-4 py-3 text-sm text-red-100">
            <div className="flex items-start gap-2">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        {result ? (
          <section className="grid gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ResultsSummary result={result} />
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadJson}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-4 py-2.5 font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
                >
                  <FileJson aria-hidden="true" className="size-5" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-4 py-2.5 font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
                >
                  <RotateCcw aria-hidden="true" className="size-5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-flex min-w-full gap-1 rounded-md border border-slate-800 bg-slate-950 p-1 shadow-sm sm:min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={
                      activeTab === tab.id
                        ? "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                        : "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                    }
                  >
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-xs text-slate-100">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "ingots" ? (
              <ResourceTable
                title="Ingots"
                rows={result.ingots}
                emptyText="No ingot requirements found."
              />
            ) : null}
            {activeTab === "components" ? (
              <ResourceTable
                title="Components"
                rows={result.components}
                emptyText="No component requirements found."
              />
            ) : null}
            {activeTab === "blocks" ? (
              <ResourceTable
                title="Blocks"
                rows={result.blocks}
                emptyText="No blocks found."
              />
            ) : null}
            {activeTab === "warnings" ? <WarningPanel warnings={result.warnings} /> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function isFileDrag(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

function getUploadErrorMessage(uploadError: unknown) {
  if (uploadError instanceof DOMException && uploadError.name === "AbortError") {
    return "Calculation timed out. Try a smaller blueprint.";
  }

  return uploadError instanceof Error ? uploadError.message : "Calculation failed.";
}

function downloadText(fileName: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function resultFileBase(result: CalculateResponse) {
  return slugify(result.blueprint.displayName || result.blueprint.fileName || "blueprint-resources");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "blueprint-resources";
}
