"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Copy, Download, Table2 } from "lucide-react";
import { rowsToCsv, rowsToTsv } from "@/lib/export";
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

  const downloadCsv = () => {
    downloadText(`${slugify(title)}.csv`, rowsToCsv(sortedRows), "text/csv;charset=utf-8");
  };

  if (rows.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 text-center text-slate-600">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Table2 aria-hidden="true" className="size-5 text-cyan-800" />
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <span className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600">
            {rows.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText("table", rowsToTsv(sortedRows))}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-100"
          >
            <Copy aria-hidden="true" className="size-4" />
            <span>{copiedKey === "table" ? "Copied" : "TSV"}</span>
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-100"
          >
            <Download aria-hidden="true" className="size-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
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
              <th scope="col" className="w-20 px-4 py-3 text-right">
                Copy
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedRows.map((row, index) => (
              <tr key={row.key} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-950">{row.label}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{row.key}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-950">
                  {formatAmount(row.count)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(row.key, `${row.label}\t${row.key}\t${row.count}`)
                    }
                    className="icon-button"
                    title="Copy row"
                    aria-label="Copy row"
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </button>
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

function downloadText(fileName: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";
}
