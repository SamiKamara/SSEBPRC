import type { CalculateResponse, CountRow } from "@/lib/types";

export function rowsToCsv(rows: CountRow[]) {
  return ["Name,Key,Count", ...rows.map((row) => [row.label, row.key, row.count].map(csvCell).join(","))].join("\n");
}

export function rowsToTsv(rows: CountRow[]) {
  return ["Name\tKey\tCount", ...rows.map((row) => `${row.label}\t${row.key}\t${row.count}`)].join("\n");
}

export function calculationToJson(calculation: CalculateResponse) {
  return JSON.stringify(calculation, null, 2);
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
      "Name,Key,Count",
      ...rows.map((row) => [row.label, row.key, row.count].map(csvCell).join(",")),
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
