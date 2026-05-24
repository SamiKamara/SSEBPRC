import { oreYieldColumns } from "@/lib/ore-yields";
import type { CalculateResponse, CountRow, OreRequirementRow } from "@/lib/types";

export function rowsToCsv(rows: CountRow[]) {
  return ["Name,Count", ...rows.map((row) => [row.label, row.count].map(csvCell).join(","))].join("\n");
}

export function rowsToTsv(rows: CountRow[]) {
  return ["Name\tCount", ...rows.map((row) => `${row.label}\t${row.count}`)].join("\n");
}

export function oreRowsToTsv(rows: OreRequirementRow[]) {
  const headers = ["Ore", ...oreYieldColumns.map((column) => column.label)];

  return [
    headers.join("\t"),
    ...rows.map((row) =>
      [
        row.label,
        ...oreYieldColumns.map((column) => row.amounts[column.key] ?? "N/A"),
      ].join("\t"),
    ),
  ].join("\n");
}

export function fullCalculationToCsv(calculation: CalculateResponse) {
  const sections: Array<[string, CountRow[]]> = [
    ["Ingots", calculation.ingots],
    ["Components", calculation.components],
    ["Blocks", calculation.blocks],
  ];

  return sections
    .flatMap(([sectionName, rows]) => [
      sectionName,
      "Name,Count",
      ...rows.map((row) => [row.label, row.count].map(csvCell).join(",")),
      "",
    ])
    .join("\n");
}

function csvCell(value: string | number) {
  const stringValue = String(value);

  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}
