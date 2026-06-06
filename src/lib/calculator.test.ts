import assert from "node:assert/strict";
import test from "node:test";
import { calculateBlueprintResources } from "@/lib/calculator";
import type { DefinitionData, ParsedBlueprint } from "@/lib/types";

const baseBlueprint: ParsedBlueprint = {
  fileName: "bp.sbc",
  sourceType: "sbc",
  displayName: "Fixture",
  gridName: "Main Grid",
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
      displayName: "Light Armor Block",
      components: [
        { subtypeId: "SteelPlate", count: 2 },
        { subtypeId: "SteelPlate", count: 3 },
      ],
    },
  ],
  componentRecipes: [
    {
      subtypeId: "SteelPlate",
      displayName: "Steel Plate",
      source: "vanilla",
      ingots: [{ subtypeId: "Iron", amount: 21 }],
    },
  ],
};

test("calculator sums repeated components and returns partial results for unknown blocks", () => {
  const result = calculateBlueprintResources(baseBlueprint, definitions);

  assert.equal(result.blueprint.gridName, "Main Grid");
  assert.equal(result.blocks.find((row) => row.key === "CubeBlock/LargeBlockArmorBlock")?.count, 2);
  assert.equal(result.blocks.find((row) => row.key === "CubeBlock/LargeBlockArmorBlock")?.label, "Light Armor Block");
  assert.equal(result.components.find((row) => row.key === "SteelPlate")?.count, 10);
  assert.equal(result.components.find((row) => row.key === "SteelPlate")?.label, "Steel Plate");
  assert.equal(result.ingots.find((row) => row.key === "Iron")?.count, 70);
  assert.equal(result.ores.find((row) => row.key === "Iron")?.amounts.refineryYield4, 50);
  assert.equal(result.ores.find((row) => row.key === "Iron")?.amounts.refineryYield0, 100);
  assert.equal(result.ores.find((row) => row.key === "Iron")?.amounts.basicRefinery, 143);
  assert.equal(result.settings.assemblerEfficiencyMultiplier, 3);
  assert.equal(result.warnings.some((warning) => warning.kind === "missing-block-definition"), true);
});

test("calculator can use vanilla 1x assembler efficiency", () => {
  const result = calculateBlueprintResources(baseBlueprint, definitions, {
    assemblerEfficiencyMultiplier: 1,
  });

  assert.equal(result.ingots.find((row) => row.key === "Iron")?.count, 210);
  assert.equal(result.ores.find((row) => row.key === "Iron")?.amounts.refineryYield4, 150);
  assert.equal(result.ores.find((row) => row.key === "Iron")?.amounts.refineryYield0, 300);
  assert.equal(result.ores.find((row) => row.key === "Iron")?.amounts.basicRefinery, 429);
  assert.equal(result.settings.assemblerEfficiencyMultiplier, 1);
});

test("calculator rounds ingot totals to whole numbers", () => {
  const result = calculateBlueprintResources(baseBlueprint, {
    ...definitions,
    componentRecipes: [
      {
        subtypeId: "SteelPlate",
        displayName: "Steel Plate",
        source: "vanilla",
        ingots: [{ subtypeId: "Iron", amount: 10 }],
      },
    ],
  });

  assert.equal(result.components.find((row) => row.key === "SteelPlate")?.count, 10);
  assert.equal(result.ingots.find((row) => row.key === "Iron")?.count, 33);
});

test("calculator labels stone ingots as gravel while keeping stone as the ore", () => {
  const result = calculateBlueprintResources(baseBlueprint, {
    ...definitions,
    componentRecipes: [
      {
        subtypeId: "SteelPlate",
        displayName: "Steel Plate",
        source: "vanilla",
        ingots: [{ subtypeId: "Stone", amount: 3 }],
      },
    ],
  });

  const gravel = result.ingots.find((row) => row.key === "Stone");
  const stone = result.ores.find((row) => row.key === "Stone");

  assert.equal(gravel?.label, "Gravel");
  assert.equal(stone?.label, "Stone");
});

test("calculator marks ore amounts unavailable for ingots the basic refinery cannot process", () => {
  const result = calculateBlueprintResources(baseBlueprint, {
    ...definitions,
    blockDefinitions: [
      {
        typeId: "MyObjectBuilder_CubeBlock",
        subtypeId: "LargeBlockArmorBlock",
        components: [{ subtypeId: "GoldComponent", count: 2 }],
      },
    ],
    componentRecipes: [
      {
        subtypeId: "GoldComponent",
        source: "vanilla",
        ingots: [{ subtypeId: "Gold", amount: 5 }],
      },
    ],
  }, {
    assemblerEfficiencyMultiplier: 1,
  });

  const goldOre = result.ores.find((row) => row.key === "Gold");

  assert.equal(result.ingots.find((row) => row.key === "Gold")?.count, 20);
  assert.equal(goldOre?.amounts.refineryYield4, 1000);
  assert.equal(goldOre?.amounts.refineryYield0, 2000);
  assert.equal(goldOre?.amounts.basicRefinery, null);
});
