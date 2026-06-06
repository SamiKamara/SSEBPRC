import { resolveBlockAlias, resolveComponentAlias } from "@/lib/compatibility";
import {
  normalizeCalculationSettings,
  type CalculationSettings,
} from "@/lib/calculation-settings";
import { calculateOreRequirements } from "@/lib/ore-yields";
import {
  formatDefinitionLabel,
  makeComponentKey,
  makeDefinitionKey,
  normalizeSubtypeId,
  normalizeTypeId,
} from "@/lib/normalization";
import type {
  BlockDefinition,
  BlueprintBlockRef,
  CalculateResponse,
  CalculationWarning,
  ComponentRecipe,
  CountRow,
  DefinitionData,
  ParsedBlueprint,
} from "@/lib/types";

type BlockDefinitionLookup = Map<string, BlockDefinition>;
type ComponentRecipeLookup = Map<string, ComponentRecipe>;

const ingotLabels = new Map([["Stone", "Gravel"]]);

export function calculateBlueprintResources(
  blueprint: ParsedBlueprint,
  definitions: DefinitionData,
  settings?: Partial<CalculationSettings>,
): CalculateResponse {
  const calculationSettings = normalizeCalculationSettings(settings);
  const blockDefinitions = buildBlockDefinitionLookup(definitions.blockDefinitions);
  const componentRecipes = buildComponentRecipeLookup(definitions.componentRecipes);
  const warnings: CalculationWarning[] = [...blueprint.warnings];
  const blockCounts = countBlocks(blueprint.blocks);
  const componentCounts = new Map<string, number>();
  const componentLabels = new Map<string, string>();
  const ingotCounts = new Map<string, number>();

  for (const blockRow of blockCounts.values()) {
    const definition = findBlockDefinition(blockRow.key, blockDefinitions);

    if (!definition) {
      warnings.push({
        kind: "missing-block-definition",
        severity: "warning",
        key: blockRow.key,
        message: `No block definition was found for ${blockRow.label}.`,
      });
      continue;
    }

    blockRow.label = definition.displayName || blockRow.label;

    for (const component of summarizeComponents(definition.components)) {
      if (component.displayName) {
        componentLabels.set(makeComponentKey(component.subtypeId), component.displayName);
      }

      addToMap(
        componentCounts,
        makeComponentKey(component.subtypeId),
        blockRow.count * component.count,
      );
    }
  }

  for (const [componentKey, componentCount] of componentCounts) {
    const recipe = findComponentRecipe(componentKey, componentRecipes);

    if (!recipe) {
      warnings.push({
        kind: "missing-component-recipe",
        severity: "warning",
        key: componentKey,
        message: `No ingot recipe was found for component ${componentKey}.`,
      });
      continue;
    }

    if (recipe.displayName) {
      componentLabels.set(componentKey, recipe.displayName);
    }

    for (const ingot of recipe.ingots) {
      addToMap(
        ingotCounts,
        normalizeSubtypeId(ingot.subtypeId),
        (componentCount * ingot.amount) / calculationSettings.assemblerEfficiencyMultiplier,
      );
    }
  }

  const components = sortRows(mapToRows(componentCounts, componentLabels));
  const ingots = sortRows(mapToRows(ingotCounts, ingotLabels, roundWholeResourceAmount));

  return {
    blueprint: {
      fileName: blueprint.fileName,
      displayName: blueprint.displayName || undefined,
      gridName: blueprint.gridName || undefined,
      gridCount: blueprint.gridCount,
      blockCount: blueprint.blockCount,
    },
    blocks: sortRows([...blockCounts.values()]),
    components,
    ingots,
    ores: calculateOreRequirements(ingots),
    warnings,
    definitionVersion: definitions.manifest.definitionVersion,
    settings: calculationSettings,
  };
}

function countBlocks(blocks: BlueprintBlockRef[]) {
  const rows = new Map<string, CountRow>();

  for (const block of blocks) {
    const key = makeDefinitionKey(block.typeId, block.subtypeId);
    const existingRow = rows.get(key);

    if (existingRow) {
      existingRow.count += 1;
    } else {
      rows.set(key, {
        key,
        label: formatDefinitionLabel(block.typeId, block.subtypeId),
        count: 1,
      });
    }
  }

  return rows;
}

function buildBlockDefinitionLookup(definitions: BlockDefinition[]): BlockDefinitionLookup {
  return new Map(
    definitions.map((definition) => [
      makeDefinitionKey(definition.typeId, definition.subtypeId),
      {
        ...definition,
        typeId: normalizeTypeId(definition.typeId),
        subtypeId: normalizeSubtypeId(definition.subtypeId),
      },
    ]),
  );
}

function buildComponentRecipeLookup(recipes: ComponentRecipe[]): ComponentRecipeLookup {
  return new Map(
    recipes.map((recipe) => [
      makeComponentKey(recipe.subtypeId),
      {
        ...recipe,
        subtypeId: normalizeSubtypeId(recipe.subtypeId),
      },
    ]),
  );
}

function findBlockDefinition(key: string, lookup: BlockDefinitionLookup) {
  const [typeId] = key.split("/");
  const fallbackKey = makeDefinitionKey(typeId, "");
  const aliasKey = resolveBlockAlias(key);

  return lookup.get(key) ?? lookup.get(fallbackKey) ?? (aliasKey ? lookup.get(aliasKey) : undefined);
}

function findComponentRecipe(key: string, lookup: ComponentRecipeLookup) {
  const aliasKey = resolveComponentAlias(key);

  return lookup.get(key) ?? (aliasKey ? lookup.get(aliasKey) : undefined);
}

function summarizeComponents(components: BlockDefinition["components"]) {
  const totals = new Map<string, { count: number; displayName?: string }>();

  for (const component of components) {
    const key = makeComponentKey(component.subtypeId);
    const existing = totals.get(key);

    totals.set(key, {
      count: (existing?.count ?? 0) + component.count,
      displayName: existing?.displayName ?? component.displayName,
    });
  }

  return [...totals.entries()].map(([subtypeId, component]) => ({
    subtypeId,
    count: component.count,
    displayName: component.displayName,
  }));
}

function mapToRows(
  counts: Map<string, number>,
  labelLookup?: Map<string, string>,
  roundAmount = roundResourceAmount,
) {
  return [...counts.entries()].map(([key, count]) => ({
    key,
    label: labelLookup?.get(key) ?? key,
    count: roundAmount(count),
  }));
}

function sortRows(rows: CountRow[]) {
  return rows.sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.label.localeCompare(right.label);
  });
}

function addToMap(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function roundResourceAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function roundWholeResourceAmount(value: number) {
  return Math.round(value + Number.EPSILON);
}
