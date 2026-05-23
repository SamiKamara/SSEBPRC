"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Copy, Table2 } from "lucide-react";
import { rowsToTsv } from "@/lib/export";
import type { CountRow } from "@/lib/types";

type ResourceTableProps = {
  title: string;
  rows: CountRow[];
  emptyText: string;
};

type SortField = "count" | "label";
type SortDirection = "asc" | "desc";

export function ResourceTable({ title, rows, emptyText }: Readonly<ResourceTableProps>) {
  const [sortField, setSortField] = useState<SortField>("count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [copiedKey, setCopiedKey] = useState<string>("");

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortField === "count") {
        if (left.count !== right.count) {
          return (left.count - right.count) * direction;
        }

        return left.label.localeCompare(right.label);
      }

      return left.label.localeCompare(right.label) * direction;
    });
  }, [rows, sortDirection, sortField]);

  const updateSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortField(field);
    setSortDirection(field === "count" ? "desc" : "asc");
  };

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1200);
  };

  if (rows.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-950 px-4 text-center text-slate-300">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Table2 aria-hidden="true" className="size-5 text-cyan-300" />
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300">
            {rows.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText("table", rowsToTsv(sortedRows))}
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
              <th scope="col" className="min-w-64 px-4 py-3">
                <button
                  type="button"
                  onClick={() => updateSort("label")}
                  className="inline-flex items-center gap-1 font-semibold"
                >
                  Name
                  <ArrowDownUp aria-hidden="true" className="size-3.5" />
                </button>
              </th>
              <th scope="col" className="min-w-36 px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => updateSort("count")}
                  className="inline-flex items-center gap-1 font-semibold"
                >
                  Amount
                  <ArrowDownUp aria-hidden="true" className="size-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {sortedRows.map((row, index) => (
              <tr key={row.key} className="hover:bg-slate-900/70">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-50">{row.label}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-50">
                  {formatAmount(row.count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
}
