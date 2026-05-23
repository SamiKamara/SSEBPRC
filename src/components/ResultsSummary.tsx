"use client";

import { AlertTriangle, Boxes, Database, Layers3, Wrench } from "lucide-react";
import type { CalculateResponse } from "@/lib/types";

type ResultsSummaryProps = {
  result: CalculateResponse;
};

export function ResultsSummary({ result }: Readonly<ResultsSummaryProps>) {
  const warningCount = result.warnings.filter((warning) => warning.severity !== "info").length;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryTile
        icon={<Layers3 aria-hidden="true" className="size-5" />}
        label="Blocks"
        value={result.blueprint.blockCount}
      />
      <SummaryTile
        icon={<Boxes aria-hidden="true" className="size-5" />}
        label="Grids"
        value={result.blueprint.gridCount}
      />
      <SummaryTile
        icon={<Wrench aria-hidden="true" className="size-5" />}
        label="Components"
        value={sumRows(result.components)}
      />
      <SummaryTile
        icon={<Database aria-hidden="true" className="size-5" />}
        label="Ingot types"
        value={result.ingots.length}
      />
      <SummaryTile
        icon={<AlertTriangle aria-hidden="true" className="size-5" />}
        label="Warnings"
        value={warningCount}
        tone={warningCount > 0 ? "warning" : "neutral"}
      />
    </section>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone = "neutral",
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "neutral" | "warning";
}>) {
  return (
    <div className="rounded-md border border-slate-300 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className={tone === "warning" ? "text-amber-700" : "text-cyan-800"}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">
        {formatAmount(value)}
      </p>
    </div>
  );
}

function sumRows(rows: CalculateResponse["components"]) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
}
