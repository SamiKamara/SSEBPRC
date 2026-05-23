import assert from "node:assert/strict";
import test from "node:test";
import { calculateBlueprintResources } from "@/lib/calculator";
import type { DefinitionData, ParsedBlueprint } from "@/lib/types";

const baseBlueprint: ParsedBlueprint = {
  fileName: "bp.sbc",
  sourceType: "sbc",
  displayName: "Fixture",
  gridCount: 1,
  blockCount: 3,
  warnings: [],
  observations: {
    blocksMissingSubtype: 0,
    inventoryItemNodeCount: 0,
    xmlParseMode: "fast-xml-parser",
  },
  blocks: [
    {
      rawTypeId: "MyObjectBuilder_CubeBlock",
      rawSubtypeId: "LargeBlockArmorBlock",
      typeId: "CubeBlock",
      subtypeId: "LargeBlockArmorBlock",
      displayKey: "CubeBlock/LargeBlockArmorBlock",
      gridIndex: 0,
    },
    {
      rawTypeId: "CubeBlock",
      rawSubtypeId: "LargeBlockArmorBlock",
      typeId: "CubeBlock",
      subtypeId: "LargeBlockArmorBlock",
      displayKey: "CubeBlock/LargeBlockArmorBlock",
      gridIndex: 0,
    },
    {
      rawTypeId: "ModdedThing",
      rawSubtypeId: "Unknown",
      typeId: "ModdedThing",
      subtypeId: "Unknown",
      displayKey: "ModdedThing/Unknown",
      gridIndex: 0,
    },
  ],
};

const definitions: DefinitionData = {
  manifest: {
    game: "Space Engineers",
    generatedAt: "2026-05-23T00:00:00.000Z",
    definitionVersion: "test",
    blockDefinitionCount: 1,
    componentRecipeCount: 1,
  },
  blockDefinitions: [
    {
      typeId: "MyObjectBuilder_CubeBlock",
      subtypeId: "LargeBlockArmorBlock",
      components: [
        { subtypeId: "SteelPlate", count: 2 },
        { subtypeId: "SteelPlate", count: 3 },
      ],
    },
  ],
  componentRecipes: [
    {
      subtypeId: "SteelPlate",
      source: "vanilla",
      ingots: [{ subtypeId: "Iron", amount: 21 }],
    },
  ],
};

test("calculator sums repeated components and returns partial results for unknown blocks", () => {
  const result = calculateBlueprintResources(baseBlueprint, definitions);

  assert.equal(result.blocks.find((row) => row.key === "CubeBlock/LargeBlockArmorBlock")?.count, 2);
  assert.equal(result.components.find((row) => row.key === "SteelPlate")?.count, 10);
  assert.equal(result.ingots.find((row) => row.key === "Iron")?.count, 210);
  assert.equal(result.warnings.some((warning) => warning.kind === "missing-block-definition"), true);
});
