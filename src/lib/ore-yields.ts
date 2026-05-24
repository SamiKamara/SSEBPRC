import type { CountRow, OreRequirementRow, OreYieldColumnKey } from "@/lib/types";

export type OreYieldColumnDefinition = {
  key: OreYieldColumnKey;
  label: string;
  isPrimary?: boolean;
};

type RefineryYieldColumnKey = Exclude<OreYieldColumnKey, "basicRefinery">;

type OreConversion = {
  ingotKey: string;
  ingotLabel: string;
  oreKey: string;
  oreLabel: string;
  refineryYield: number;
  basicRefinery: boolean;
};

export const oreYieldColumns: OreYieldColumnDefinition[] = [
  { key: "refineryYield4", label: "4 Yield modules", isPrimary: true },
  { key: "refineryYield3", label: "3 Yield modules" },
  { key: "refineryYield2", label: "2 Yield modules" },
  { key: "refineryYield1", label: "1 Yield module" },
  { key: "refineryYield0", label: "0 Yield modules" },
  { key: "basicRefinery", label: "Basic refinery" },
];

const refineryEffectiveness: Record<RefineryYieldColumnKey, number> = {
  refineryYield4: 2,
  refineryYield3: 1.68,
  refineryYield2: 1.41,
  refineryYield1: 1.19,
  refineryYield0: 1,
};

const basicRefineryMaterialEfficiency = 0.7;

const oreConversions: OreConversion[] = [
  {
    ingotKey: "Stone",
    ingotLabel: "Gravel",
    oreKey: "Stone",
    oreLabel: "Stone",
    refineryYield: 0.014,
    basicRefinery: true,
  },
  {
    ingotKey: "Iron",
    ingotLabel: "Iron Ingot",
    oreKey: "Iron",
    oreLabel: "Iron Ore",
    refineryYield: 0.7,
    basicRefinery: true,
  },
  {
    ingotKey: "Silicon",
    ingotLabel: "Silicon Wafer",
    oreKey: "Silicon",
    oreLabel: "Silicon Ore",
    refineryYield: 0.7,
    basicRefinery: true,
  },
  {
    ingotKey: "Nickel",
    ingotLabel: "Nickel Ingot",
    oreKey: "Nickel",
    oreLabel: "Nickel Ore",
    refineryYield: 0.4,
    basicRefinery: true,
  },
  {
    ingotKey: "Cobalt",
    ingotLabel: "Cobalt Ingot",
    oreKey: "Cobalt",
    oreLabel: "Cobalt Ore",
    refineryYield: 0.3,
    basicRefinery: true,
  },
  {
    ingotKey: "Silver",
    ingotLabel: "Silver Ingot",
    oreKey: "Silver",
    oreLabel: "Silver Ore",
    refineryYield: 0.1,
    basicRefinery: false,
  },
  {
    ingotKey: "Gold",
    ingotLabel: "Gold Ingot",
    oreKey: "Gold",
    oreLabel: "Gold Ore",
    refineryYield: 0.01,
    basicRefinery: false,
  },
  {
    ingotKey: "Uranium",
    ingotLabel: "Uranium Ingot",
    oreKey: "Uranium",
    oreLabel: "Uranium Ore",
    refineryYield: 0.01,
    basicRefinery: false,
  },
  {
    ingotKey: "Magnesium",
    ingotLabel: "Magnesium Powder",
    oreKey: "Magnesium",
    oreLabel: "Magnesium Ore",
    refineryYield: 0.007,
    basicRefinery: true,
  },
  {
    ingotKey: "Platinum",
    ingotLabel: "Platinum Ingot",
    oreKey: "Platinum",
    oreLabel: "Platinum Ore",
    refineryYield: 0.005,
    basicRefinery: false,
  },
];

const oreConversionsByIngot = new Map<string, OreConversion>(
  oreConversions.map((conversion) => [conversion.ingotKey, conversion]),
);

export function calculateOreRequirements(ingots: CountRow[]): OreRequirementRow[] {
  return ingots
    .flatMap((ingot) => {
      const conversion = oreConversionsByIngot.get(ingot.key);

      if (!conversion) {
        return [];
      }

      const amounts = Object.fromEntries(
        oreYieldColumns.map((column) => [
          column.key,
          calculateOreAmount(ingot.count, conversion, column.key),
        ]),
      ) as Record<OreYieldColumnKey, number | null>;

      return [
        {
          key: conversion.oreKey,
          label: conversion.oreLabel,
          ingotKey: conversion.ingotKey,
          ingotLabel: conversion.ingotLabel,
          ingotCount: ingot.count,
          amounts,
        },
      ];
    })
    .sort((left, right) => {
      const leftPrimary = left.amounts.refineryYield4 ?? 0;
      const rightPrimary = right.amounts.refineryYield4 ?? 0;

      if (rightPrimary !== leftPrimary) {
        return rightPrimary - leftPrimary;
      }

      return left.label.localeCompare(right.label);
    });
}

function calculateOreAmount(
  ingotCount: number,
  conversion: OreConversion,
  columnKey: OreYieldColumnKey,
) {
  const yieldRatio =
    columnKey === "basicRefinery"
      ? conversion.basicRefinery
        ? conversion.refineryYield * basicRefineryMaterialEfficiency
        : null
      : conversion.refineryYield * refineryEffectiveness[columnKey];

  return yieldRatio ? Math.round(ingotCount / yieldRatio) : null;
}
