import assert from "node:assert/strict";
import test from "node:test";
import { rowsToCsv, rowsToTsv } from "@/lib/export";
import type { CountRow } from "@/lib/types";

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
