import { XMLParser, XMLValidator } from "fast-xml-parser";
import {
  formatDefinitionLabel,
  localName,
  makeDefinitionKey,
  normalizeSubtypeId,
  normalizeTypeId,
} from "@/lib/normalization";
import type { BlueprintBlockRef, CalculationWarning, ParsedBlueprint, UploadedBlueprint } from "@/lib/types";

type XmlRecord = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  allowBooleanAttributes: true,
});

export function parseBlueprint(uploadedBlueprint: UploadedBlueprint): ParsedBlueprint {
  const validation = XMLValidator.validate(uploadedBlueprint.xml, {
    allowBooleanAttributes: true,
  });

  if (validation !== true) {
    throw new BlueprintParseError("Blueprint XML could not be read.");
  }

  let parsed: unknown;

  try {
    parsed = parser.parse(uploadedBlueprint.xml);
  } catch {
    throw new BlueprintParseError("Blueprint XML could not be read.");
  }

  const grids = collectElementsByLocalName(parsed, "CubeGrid").filter(isRecord);
  const warnings: CalculationWarning[] = [];
  const blocks: BlueprintBlockRef[] = [];
  let gridsWithCubeBlocks = 0;
  let blocksMissingSubtype = 0;

  grids.forEach((grid, gridIndex) => {
    const cubeBlocks = findFirstElementByLocalName(grid, "CubeBlocks");

    if (!cubeBlocks || !isRecord(cubeBlocks)) {
      return;
    }

    gridsWithCubeBlocks += 1;

    for (const block of readCubeBlocks(cubeBlocks, gridIndex)) {
      if (!hasDirectChild(block.sourceNode, "SubtypeName")) {
        blocksMissingSubtype += 1;
      }

      blocks.push(block.ref);
    }
  });

  if (grids.length === 0 || gridsWithCubeBlocks === 0) {
    throw new BlueprintParseError("The blueprint did not contain a CubeBlocks structure.");
  }

  const inventoryItemNodeCount = collectElementsByLocalName(parsed, "Items").length;

  if (blocksMissingSubtype > 0) {
    warnings.push({
      kind: "schema-drift-detected",
      severity: "info",
      message:
        "Some blocks were missing a SubtypeName node. Calculation continued with the default subtype.",
    });
  }

  return {
    fileName: uploadedBlueprint.fileName,
    sourceType: uploadedBlueprint.sourceType,
    displayName: readOptionalText(findFirstElementByLocalName(parsed, "DisplayName")),
    gridCount: grids.length,
    blockCount: blocks.length,
    blocks,
    warnings,
    observations: {
      blocksMissingSubtype,
      inventoryItemNodeCount,
      xmlParseMode: "fast-xml-parser",
    },
  };
}

function readCubeBlocks(cubeBlocks: XmlRecord, gridIndex: number) {
  const blocks: Array<{ ref: BlueprintBlockRef; sourceNode: XmlRecord }> = [];

  for (const [tagName, value] of Object.entries(cubeBlocks)) {
    if (isMetadataKey(tagName)) {
      continue;
    }

    const entries = Array.isArray(value) ? value : [value];

    for (const entry of entries) {
      if (!isRecord(entry)) {
        continue;
      }

      const rawTypeId = readAttribute(entry, "type") || readIdType(entry) || normalizeTypeId(tagName);
      const rawSubtypeId = readOptionalText(findDirectChild(entry, "SubtypeName"));
      const typeId = normalizeTypeId(rawTypeId);
      const subtypeId = normalizeSubtypeId(rawSubtypeId);

      blocks.push({
        sourceNode: entry,
        ref: {
          rawTypeId,
          rawSubtypeId,
          typeId,
          subtypeId,
          displayKey: makeDefinitionKey(typeId, subtypeId),
          gridIndex,
        },
      });
    }
  }

  return blocks;
}

function readIdType(node: XmlRecord) {
  const idNode = findDirectChild(node, "Id");

  if (!isRecord(idNode)) {
    return "";
  }

  return readOptionalText(findDirectChild(idNode, "TypeId"));
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

function findFirstElementByLocalName(node: unknown, elementName: string): unknown {
  let match: unknown;

  visitXml(node, (key, value) => {
    if (match !== undefined || localName(key) !== elementName) {
      return;
    }

    match = Array.isArray(value) ? value[0] : value;
  });

  return match;
}

function findDirectChild(node: XmlRecord, childName: string): unknown {
  for (const [key, value] of Object.entries(node)) {
    if (localName(key) === childName) {
      return value;
    }
  }

  return undefined;
}

function hasDirectChild(node: XmlRecord, childName: string) {
  return findDirectChild(node, childName) !== undefined;
}

function readOptionalText(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (isRecord(value)) {
    const textValue = value["#text"];

    if (
      typeof textValue === "string" ||
      typeof textValue === "number" ||
      typeof textValue === "boolean"
    ) {
      return String(textValue).trim();
    }
  }

  return "";
}

function readAttribute(node: XmlRecord, attributeName: string) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@") && localName(key) === attributeName) {
      return readOptionalText(value);
    }
  }

  return "";
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
    if (isMetadataKey(key)) {
      continue;
    }

    visitor(key, value);
    visitXml(value, visitor);
  }
}

function isMetadataKey(key: string) {
  return key.startsWith("@") || key === "#text";
}

function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class BlueprintParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlueprintParseError";
  }
}

export function blockRefToLabel(block: BlueprintBlockRef) {
  return formatDefinitionLabel(block.typeId, block.subtypeId);
}
