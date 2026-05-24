import assert from "node:assert/strict";
import test from "node:test";
import { oreRowsToTsv, rowsToCsv, rowsToTsv } from "@/lib/export";
import type { CountRow, OreRequirementRow } from "@/lib/types";

const rows: CountRow[] = [
  {
    key: "CubeBlock/LargeBlockArmorBlock",
    label: "Light Armor Block",
    count: 2,
  },
  {
    key: "SteelPlate",
    label: "Steel Plate",
    count: 130,
  },
];

test("exports rows as name and count without internal keys", () => {
  assert.equal(rowsToTsv(rows), "Name\tCount\nLight Armor Block\t2\nSteel Plate\t130");
  assert.equal(rowsToCsv(rows), "Name,Count\nLight Armor Block,2\nSteel Plate,130");
});

test("exports ore rows with refinery yield columns", () => {
  const oreRows: OreRequirementRow[] = [
    {
      key: "Gold",
      label: "Gold Ore",
      ingotKey: "Gold",
      ingotLabel: "Gold Ingot",
      ingotCount: 20,
      amounts: {
        refineryYield4: 1000,
        refineryYield3: 1190,
        refineryYield2: 1418,
        refineryYield1: 1681,
        refineryYield0: 2000,
        basicRefinery: null,
      },
    },
  ];

  assert.equal(
    oreRowsToTsv(oreRows),
    "Ore\t4 Yield modules\t3 Yield modules\t2 Yield modules\t1 Yield module\t0 Yield modules\tBasic refinery\nGold Ore\t1000\t1190\t1418\t1681\t2000\tN/A",
  );
});
