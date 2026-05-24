"use client";

import { AlertTriangle, Boxes, Database, Layers3, Wrench } from "lucide-react";
import type { CalculateResponse } from "@/lib/types";

type ResultsSummaryProps = {
  result: CalculateResponse;
};

export function ResultsSummary({ result }: Readonly<ResultsSummaryProps>) {
  const warningCount = result.warnings.length;
  const gridColumns = warningCount > 0 ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <section className={`grid flex-1 gap-3 ${gridColumns}`}>
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
      {warningCount > 0 ? (
        <SummaryTile
          icon={<AlertTriangle aria-hidden="true" className="size-5" />}
          label="Warnings"
          value={warningCount}
          tone="warning"
        />
      ) : null}
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
    <div className="rounded-md border border-slate-800 bg-slate-950 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className={tone === "warning" ? "text-amber-300" : "text-cyan-300"}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-50">
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
