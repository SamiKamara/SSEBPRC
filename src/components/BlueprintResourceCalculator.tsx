"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  Download,
  FileJson,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { ResourceTable } from "@/components/ResourceTable";
import { ResultsSummary } from "@/components/ResultsSummary";
import { WarningPanel } from "@/components/WarningPanel";
import { calculationToJson, fullCalculationToCsv } from "@/lib/export";
import { validateBlueprintFile } from "@/lib/file-validation";
import type {
  CalculateErrorResponse,
  CalculateResponse,
  DefinitionsResponse,
} from "@/lib/types";

type UploadState = "idle" | "validating" | "uploading" | "success" | "error";
type ResultTab = "ingots" | "components" | "blocks" | "warnings";

const requestTimeoutMs = 45000;

export function BlueprintResourceCalculator() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("ingots");
  const [definitionVersion, setDefinitionVersion] = useState("Loading");
  const [definitionNote, setDefinitionNote] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDefinitionManifest() {
      try {
        const response = await fetch("/api/definitions", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Definition data could not be loaded.");
        }

        const data = (await response.json()) as DefinitionsResponse;

        if (!ignore) {
          setDefinitionVersion(data.manifest.definitionVersion);
          setDefinitionNote(data.manifest.note ?? "");
        }
      } catch {
        if (!ignore) {
          setDefinitionVersion("unavailable");
        }
      }
    }

    void loadDefinitionManifest();

    return () => {
      ignore = true;
    };
  }, []);

  const tabs = useMemo(
    () => [
      { id: "ingots" as const, label: "Ingots", count: result?.ingots.length ?? 0 },
      {
        id: "components" as const,
        label: "Components",
        count: result?.components.length ?? 0,
      },
      { id: "blocks" as const, label: "Blocks", count: result?.blocks.length ?? 0 },
      { id: "warnings" as const, label: "Warnings", count: result?.warnings.length ?? 0 },
    ],
    [result],
  );

  const isBusy = uploadState === "validating" || uploadState === "uploading";
  const headline =
    result?.blueprint.displayName || result?.blueprint.fileName || "Blueprint resource calculator";

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
      setDefinitionVersion(data.definitionVersion);
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

  const downloadCsv = () => {
    if (!result) {
      return;
    }

    downloadText(`${resultFileBase(result)}.csv`, fullCalculationToCsv(result), "text/csv;charset=utf-8");
  };

  return (
    <main className="min-h-screen px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="border-b border-slate-300 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-800">
                SSEBPRC
              </p>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-4xl">
                {headline}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <Database aria-hidden="true" className="size-4 text-cyan-800" />
              <span className="font-medium">Definitions</span>
              <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs">
                {definitionVersion}
              </span>
            </div>
          </div>
        </header>

        <FileDropzone
          isBusy={isBusy}
          selectedFileName={selectedFileName}
          onFileSelected={(file) => void handleFileSelected(file)}
        />

        {definitionNote ? (
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-950">
            {definitionNote}
          </div>
        ) : null}

        {isBusy ? (
          <div className="flex min-h-28 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm">
            <Loader2 aria-hidden="true" className="mr-2 size-5 animate-spin text-cyan-800" />
            {uploadState === "validating" ? "Checking file" : "Calculating resources"}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
                  onClick={downloadCsv}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:border-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                >
                  <Download aria-hidden="true" className="size-5" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={downloadJson}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:border-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                >
                  <FileJson aria-hidden="true" className="size-5" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:border-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                >
                  <RotateCcw aria-hidden="true" className="size-5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-flex min-w-full gap-1 rounded-md border border-slate-300 bg-white p-1 shadow-sm sm:min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={
                      activeTab === tab.id
                        ? "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold text-white bg-slate-950"
                        : "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    }
                  >
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-slate-800">
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
