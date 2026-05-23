"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { CalculationWarning } from "@/lib/types";

type WarningPanelProps = {
  warnings: CalculationWarning[];
};

export function WarningPanel({ warnings }: Readonly<WarningPanelProps>) {
  if (warnings.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 text-center text-slate-600">
        <CheckCircle2 aria-hidden="true" className="mr-2 size-5 text-emerald-700" />
        No warnings.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {warnings.map((warning, index) => (
        <article
          key={`${warning.kind}-${warning.key ?? index}`}
          className={
            warning.severity === "info"
              ? "rounded-md border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-950"
              : "rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
          }
        >
          <div className="flex items-start gap-3">
            {warning.severity === "info" ? (
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cyan-800" />
            ) : (
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" />
            )}
            <div className="min-w-0">
              <p className="font-medium">{warning.message}</p>
              {warning.key ? (
                <p className="mt-1 font-mono text-sm opacity-80">{warning.key}</p>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
