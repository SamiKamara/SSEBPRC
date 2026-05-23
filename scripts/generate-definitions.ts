import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { localName, normalizeSubtypeId, normalizeTypeId } from "../src/lib/normalization";
import type { BlockDefinition, ComponentRecipe, DefinitionManifest } from "../src/lib/types";

type XmlRecord = Record<string, unknown>;
type RecipeCandidate = {
  recipe: ComponentRecipe;
  isPrimary: boolean;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  allowBooleanAttributes: true,
});

async function main() {
  const dataRoot = await resolveDataRoot();
  const cubeBlockRoot = path.join(dataRoot, "CubeBlocks");
  const cubeBlockFiles = await walkSbcFiles(cubeBlockRoot);
  const blueprintFiles = (await walkSbcFiles(dataRoot)).filter((filePath) =>
    path.basename(filePath).toLowerCase().startsWith("blueprints"),
  );
  const localization = await loadLocalization(dataRoot);
  const componentDisplayNames = await loadComponentDisplayNames(dataRoot, localization);

  const blockDefinitions = await generateBlockDefinitions(cubeBlockFiles, localization, componentDisplayNames);
  const componentRecipes = await generateComponentRecipes(blueprintFiles, componentDisplayNames);
  const manifest: DefinitionManifest = {
    game: "Space Engineers",
    generatedAt: new Date().toISOString(),
    definitionVersion: `vanilla-${new Date().toISOString().slice(0, 10)}`,
    blockDefinitionCount: blockDefinitions.length,
    componentRecipeCount: componentRecipes.length,
  };

  const outputRoot = path.join(process.cwd(), "src", "data", "space-engineers");
  await writeJson(path.join(outputRoot, "definitions-manifest.json"), manifest);
  await writeJson(path.join(outputRoot, "vanilla-block-components.json"), blockDefinitions);
  await writeJson(path.join(outputRoot, "vanilla-component-recipes.json"), componentRecipes);

  console.log(
    `Generated ${blockDefinitions.length} block definitions and ${componentRecipes.length} component recipes from ${dataRoot}`,
  );
}

async function resolveDataRoot() {
  const explicitRoot = process.argv[2] ?? process.env.SPACE_ENGINEERS_CONTENT;

  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }

  const programFilesX86 = process.env["ProgramFiles(x86)"];
  const candidates = [
    programFilesX86
      ? path.join(programFilesX86, "Steam", "steamapps", "common", "SpaceEngineers", "Content", "Data")
      : "",
    path.join(
      process.env.ProgramFiles ?? "C:\\Program Files",
      "Steam",
      "steamapps",
      "common",
      "SpaceEngineers",
      "Content",
      "Data",
    ),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isDirectory()) {
        return candidate;
      }
    } catch {
      // Try the next common install location.
    }
  }

  throw new Error(
    "Space Engineers Content\\Data folder was not found. Provide a path: npm run generate-definitions -- \"C:\\...\\SpaceEngineers\\Content\\Data\"",
  );
}

async function generateBlockDefinitions(
  filePaths: string[],
  localization: Map<string, string>,
  componentDisplayNames: Map<string, string>,
) {
  const definitions = new Map<string, BlockDefinition>();

  for (const filePath of filePaths) {
    const parsed = parser.parse(await readFile(filePath, "utf-8"));

    for (const definition of collectElementsByLocalName(parsed, "Definition").filter(isRecord)) {
      const id = findDirectChild(definition, "Id");
      const typeId = normalizeTypeId(readNestedText(id, "TypeId") || readNestedText(definition, "TypeId"));
      const subtypeId = normalizeSubtypeId(
        readNestedText(id, "SubtypeId") || readNestedText(definition, "SubtypeId"),
      );

      if (!typeId) {
        continue;
      }

      const components = summarizeComponentDefinitions(
        collectElementsByLocalName(definition, "Component"),
        componentDisplayNames,
      );

      if (components.length === 0) {
        continue;
      }

      const rawDisplayName = readNestedText(definition, "DisplayName");
      const key = `${typeId}/${subtypeId}`;
      definitions.set(key, {
        typeId,
        subtypeId,
        displayName: resolveDisplayName(rawDisplayName, localization) || humanizeIdentifier(subtypeId || typeId),
        components,
      });
    }
  }

  return [...definitions.values()].sort((left, right) =>
    `${left.typeId}/${left.subtypeId}`.localeCompare(`${right.typeId}/${right.subtypeId}`),
  );
}

async function generateComponentRecipes(filePaths: string[], componentDisplayNames: Map<string, string>) {
  const recipes = new Map<string, RecipeCandidate>();

  for (const filePath of filePaths) {
    const parsed = parser.parse(await readFile(filePath, "utf-8"));

    for (const blueprint of collectElementsByLocalName(parsed, "Blueprint").filter(isRecord)) {
      const results = readRecipeItems(blueprint, "Results", "Result");
      const prerequisites = readRecipeItems(blueprint, "Prerequisites", "Prerequisite");
      const componentResult = results.find((item) => item.typeId === "Component" && item.subtypeId);

      if (!componentResult) {
        continue;
      }

      const ingots = prerequisites
        .filter((item) => item.typeId === "Ingot" && item.subtypeId && item.amount > 0)
        .map((item) => ({
          subtypeId: item.subtypeId,
          amount: item.amount / Math.max(componentResult.amount, 1),
        }));

      if (ingots.length === 0) {
        continue;
      }

      const isPrimary = readBoolean(readAttribute(blueprint, "IsPrimary") || readNestedText(blueprint, "IsPrimary"));
      const existing = recipes.get(componentResult.subtypeId);

      if (!existing || (isPrimary && !existing.isPrimary)) {
        recipes.set(componentResult.subtypeId, {
          isPrimary,
          recipe: {
            subtypeId: componentResult.subtypeId,
            displayName: componentDisplayNames.get(componentResult.subtypeId) ?? humanizeIdentifier(componentResult.subtypeId),
            source: "vanilla",
            ingots,
          },
        });
      }
    }
  }

  return [...recipes.values()]
    .map((candidate) => candidate.recipe)
    .sort((left, right) => left.subtypeId.localeCompare(right.subtypeId));
}

async function loadLocalization(dataRoot: string) {
  const localizationPath = path.join(dataRoot, "Localization", "MyTexts.resx");
  const parsed = parser.parse(await readFile(localizationPath, "utf-8"));
  const entries = new Map<string, string>();

  for (const entry of collectElementsByLocalName(parsed, "data").filter(isRecord)) {
    const name = readAttribute(entry, "name");
    const value = readNestedText(entry, "value");

    if (name && value) {
      entries.set(name, value);
    }
  }

  return entries;
}

async function loadComponentDisplayNames(dataRoot: string, localization: Map<string, string>) {
  const parsed = parser.parse(await readFile(path.join(dataRoot, "Components.sbc"), "utf-8"));
  const displayNames = new Map<string, string>();

  for (const definition of collectElementsByLocalName(parsed, "Definition").filter(isRecord)) {
    const id = findDirectChild(definition, "Id");
    const typeId = normalizeTypeId(readNestedText(id, "TypeId") || readNestedText(definition, "TypeId"));
    const subtypeId = normalizeSubtypeId(
      readNestedText(id, "SubtypeId") || readNestedText(definition, "SubtypeId"),
    );

    if (typeId !== "Component" || !subtypeId) {
      continue;
    }

    const rawDisplayName = readNestedText(definition, "DisplayName");
    displayNames.set(subtypeId, resolveDisplayName(rawDisplayName, localization) || humanizeIdentifier(subtypeId));
  }

  return displayNames;
}

function readRecipeItems(node: XmlRecord, wrapperName: string, singularName: string) {
  const wrappers = collectElementsByLocalName(node, wrapperName);
  const directItems = collectElementsByLocalName(node, singularName);
  const wrappedItems = wrappers.flatMap((wrapper) => collectElementsByLocalName(wrapper, "Item"));
  const items = [...directItems, ...wrappedItems].filter(isRecord);

  return items.map((item) => ({
    typeId: normalizeTypeId(readAttribute(item, "TypeId") || readNestedText(item, "TypeId")),
    subtypeId: normalizeSubtypeId(
      readAttribute(item, "SubtypeId") ||
        readAttribute(item, "Subtype") ||
        readNestedText(item, "SubtypeId"),
    ),
    amount: readNumber(readAttribute(item, "Amount") || readAttribute(item, "Count") || readNestedText(item, "Amount")),
  }));
}

function summarizeComponentDefinitions(components: unknown[], componentDisplayNames: Map<string, string>) {
  const totals = new Map<string, number>();

  for (const component of components.filter(isRecord)) {
    const subtypeId = normalizeSubtypeId(
      readAttribute(component, "Subtype") ||
        readAttribute(component, "SubtypeId") ||
        readNestedText(component, "SubtypeId"),
    );
    const count = readNumber(readAttribute(component, "Count") || readNestedText(component, "Count"));

    if (!subtypeId || count <= 0) {
      continue;
    }

    totals.set(subtypeId, (totals.get(subtypeId) ?? 0) + count);
  }

  return [...totals.entries()]
    .map(([subtypeId, count]) => ({
      subtypeId,
      displayName: componentDisplayNames.get(subtypeId) ?? humanizeIdentifier(subtypeId),
      count,
    }))
    .sort((left, right) => left.subtypeId.localeCompare(right.subtypeId));
}

async function walkSbcFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(root, entry.name);

      if (entry.isDirectory()) {
        return walkSbcFiles(fullPath);
      }

      return entry.isFile() && entry.name.toLowerCase().endsWith(".sbc") ? [fullPath] : [];
    }),
  );

  return files.flat();
}

function collectElementsByLocalName(node: unknown, elementName: string): unknown[] {
  const matches: unknown[] = [];

  visitXml(node, (key, value) => {
    if (localName(key) === elementName) {
      if (Array.isArray(value)) {
        matches.push(...value);
      } else {
        matches.push(value);
      }
    }
  });

  return matches;
}

function findDirectChild(node: unknown, childName: string): unknown {
  if (!isRecord(node)) {
    return undefined;
  }

  for (const [key, value] of Object.entries(node)) {
    if (localName(key) === childName) {
      return value;
    }
  }

  return undefined;
}

function readNestedText(node: unknown, childName: string) {
  return readText(findDirectChild(node, childName));
}

function readText(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (isRecord(value)) {
    return readText(value["#text"]);
  }

  return "";
}

function readAttribute(node: XmlRecord, attributeName: string) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@") && localName(key) === attributeName) {
      return readText(value);
    }
  }

  return "";
}

function readNumber(value: string) {
  const amount = Number.parseFloat(value);

  return Number.isFinite(amount) ? amount : 0;
}

function readBoolean(value: string) {
  return value.toLowerCase() === "true" || value === "1";
}

function resolveDisplayName(displayNameKey: string, localization: Map<string, string>) {
  return localization.get(displayNameKey) ?? "";
}

function humanizeIdentifier(value: string) {
  return value
    .replace(/^LargeBlock/, "Large ")
    .replace(/^SmallBlock/, "Small ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visitXml(node: unknown, visitor: (key: string, value: unknown) => void) {
  if (Array.isArray(node)) {
    node.forEach((child) => visitXml(child, visitor));
    return;
  }

  if (!isRecord(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@") || key === "#text") {
      continue;
    }

    visitor(key, value);
    visitXml(value, visitor);
  }
}

function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
