"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Copy, Table2 } from "lucide-react";
import { oreRowsToTsv } from "@/lib/export";
import { oreYieldColumns } from "@/lib/ore-yields";
import type { OreRequirementRow, OreYieldColumnKey } from "@/lib/types";

type OresTableProps = {
  rows: OreRequirementRow[];
};

type SortField = "label" | OreYieldColumnKey;
type SortDirection = "asc" | "desc";

export function OresTable({ rows }: Readonly<OresTableProps>) {
  const [sortField, setSortField] = useState<SortField>("refineryYield4");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [copiedKey, setCopiedKey] = useState("");

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => compareRows(left, right, sortField, sortDirection));
  }, [rows, sortDirection, sortField]);

  const updateSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortField(field);
    setSortDirection(field === "label" ? "asc" : "desc");
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(oreRowsToTsv(sortedRows));
    setCopiedKey("table");
    window.setTimeout(() => setCopiedKey(""), 1200);
  };

  if (rows.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-950 px-4 text-center text-slate-300">
        No ore requirements found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Table2 aria-hidden="true" className="size-5 text-cyan-300" />
          <h2 className="text-lg font-semibold text-slate-50">Ores</h2>
          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300">
            {rows.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
          >
            <Copy aria-hidden="true" className="size-4" />
            <span>{copiedKey === "table" ? "Copied" : "Copy list"}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase text-slate-400">
            <tr>
              <th scope="col" className="w-16 px-4 py-3">
                #
              </th>
              <th scope="col" className="min-w-44 px-4 py-3">
                <SortButton label="Ore" onClick={() => updateSort("label")} />
              </th>
              {oreYieldColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`min-w-36 px-4 py-3 text-right ${
                    column.isPrimary ? "font-bold text-cyan-100" : ""
                  }`}
                >
                  <SortButton label={column.label} onClick={() => updateSort(column.key)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {sortedRows.map((row, index) => (
              <tr key={row.key} className="hover:bg-slate-900/70">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-50">{row.label}</div>
                </td>
                {oreYieldColumns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-right font-mono ${
                      column.isPrimary ? "font-bold text-cyan-100" : "text-slate-50"
                    }`}
                  >
                    {formatNullableAmount(row.amounts[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortButton({ label, onClick }: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 font-semibold">
      <span>{label}</span>
      <ArrowDownUp aria-hidden="true" className="size-3.5" />
    </button>
  );
}

function compareRows(
  left: OreRequirementRow,
  right: OreRequirementRow,
  sortField: SortField,
  sortDirection: SortDirection,
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  if (sortField === "label") {
    return left.label.localeCompare(right.label) * direction;
  }

  const leftValue = left.amounts[sortField];
  const rightValue = right.amounts[sortField];

  if (leftValue === null && rightValue === null) {
    return left.label.localeCompare(right.label);
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  if (leftValue !== rightValue) {
    return (leftValue - rightValue) * direction;
  }

  return left.label.localeCompare(right.label);
}

function formatNullableAmount(value: number | null) {
  return value === null ? "N/A" : formatAmount(value);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
}
