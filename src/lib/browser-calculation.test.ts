import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import JSZip from "jszip";
import { calculateBlueprintInBrowser } from "@/lib/browser-calculation";
import { loadDefinitions } from "@/lib/definition-loader";
import type { CalculateResponse, CountRow } from "@/lib/types";

// Costs checked against the Warfare 3 game definitions (Steam build 26329893).
const expectedComponents = {
  SteelPlate: 939,
  Construction: 820,
  MetalGrid: 125,
  LargeTube: 102,
  Motor: 117,
  Computer: 181,
  Explosives: 11,
  PrototechPanel: 70,
  Superconductor: 134,
  PrototechCircuitry: 7,
  PrototechCapacitor: 14,
  InteriorPlate: 72,
  SmallTube: 48,
  Girder: 75,
  Display: 5,
  Detector: 35,
  RadioCommunication: 25,
  BulletproofGlass: 46,
};

function counts(rows: CountRow[]) {
  return Object.fromEntries(rows.map(({ key, count }) => [key, count]));
}

function assertWarfare3Blueprint(result: CalculateResponse) {
  assert.equal(result.blueprint.displayName, "Warfare 3 Resource Check");
  assert.equal(result.blueprint.gridCount, 2);
  assert.equal(result.blueprint.blockCount, 19);
  assert.equal(result.blocks.length, 19);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(counts(result.components), expectedComponents);
  assert.equal(
    result.blocks.find(({ key }) => key === "Cockpit/FighterCockpitType2")?.label,
    "Fighter Cockpit Type II",
  );
  assert.equal(result.definitionVersion, loadDefinitions().manifest.definitionVersion);
}

test("browser calculation resolves Warfare 3 free and DLC blocks at 1x efficiency", async () => {
  const xml = await readFile("fixtures/warfare3-bp.sbc", "utf8");
  const result = await calculateBlueprintInBrowser(new File([xml], "bp.sbc"), {
    assemblerEfficiencyMultiplier: 1,
  });

  assertWarfare3Blueprint(result);
  assert.deepEqual(counts(result.ingots), {
    Iron: 38549,
    Nickel: 2225,
    Cobalt: 585,
    Silicon: 894,
    Magnesium: 302,
    Gold: 366,
    Platinum: 11,
    PrototechScrap: 33,
    Silver: 42,
  });
});

test("zipped Warfare 3 blueprints retain component costs and apply 3x efficiency", async () => {
  const zip = new JSZip();
  zip.file("Warfare 3/bp.sbc", await readFile("fixtures/warfare3-bp.sbc", "utf8"));
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  const result = await calculateBlueprintInBrowser(new File([buffer], "Warfare 3.zip"), {
    assemblerEfficiencyMultiplier: 3,
  });

  assertWarfare3Blueprint(result);
  assert.deepEqual(counts(result.ingots), {
    Iron: 12850,
    Nickel: 742,
    Cobalt: 195,
    Silicon: 298,
    Magnesium: 101,
    Gold: 122,
    Platinum: 4,
    PrototechScrap: 11,
    Silver: 14,
  });
});

test("bundled definitions are complete and only non-craftable items lack ingot recipes", () => {
  const { manifest, blockDefinitions, componentRecipes } = loadDefinitions();
  const blockKeys = blockDefinitions.map(({ typeId, subtypeId }) => `${typeId}/${subtypeId}`);
  const recipeKeys = new Set(componentRecipes.map(({ subtypeId }) => subtypeId));
  const nonCraftableItems = new Set([
    "PrototechFrame", "EngineerPlushie", "EngineerPlushieSE2", "SabiroidPlushie", "ZoneChip",
  ]);

  assert.equal(manifest.blockDefinitionCount, blockDefinitions.length);
  assert.equal(manifest.componentRecipeCount, componentRecipes.length);
  assert.equal(new Set(blockKeys).size, blockKeys.length);
  assert.equal(recipeKeys.size, componentRecipes.length);

  for (const block of blockDefinitions) {
    const key = `${block.typeId}/${block.subtypeId}`;
    assert.ok(block.displayName && !block.displayName.startsWith("DisplayName_"), key);
    assert.ok(block.components.length > 0, key);

    for (const component of block.components) {
      assert.ok(Number.isInteger(component.count) && component.count > 0, key);
      assert.ok(recipeKeys.has(component.subtypeId) || nonCraftableItems.has(component.subtypeId),
        `${key}: no recipe for ${component.subtypeId}`);
    }
  }
});
