export type UploadedBlueprint = {
  fileName: string;
  sourceType: "sbc" | "zip";
  xml: string;
};

export type BlueprintBlockRef = {
  rawTypeId: string;
  rawSubtypeId: string;
  typeId: string;
  subtypeId: string;
  displayKey: string;
  gridIndex: number;
};

export type ParsedBlueprint = {
  fileName: string;
  sourceType: "sbc" | "zip";
  displayName?: string;
  gridName?: string;
  gridCount: number;
  blockCount: number;
  blocks: BlueprintBlockRef[];
  warnings: CalculationWarning[];
  observations: ParserObservations;
};

export type ParserObservations = {
  blocksMissingSubtype: number;
  inventoryItemNodeCount: number;
  xmlParseMode: "fast-xml-parser";
};

export type BlockDefinition = {
  typeId: string;
  subtypeId: string;
  displayName?: string;
  components: ComponentAmount[];
};

export type ComponentRecipe = {
  subtypeId: string;
  displayName?: string;
  ingots: IngotAmount[];
  source: "vanilla" | "custom";
};

export type ComponentAmount = {
  subtypeId: string;
  displayName?: string;
  count: number;
};

export type IngotAmount = {
  subtypeId: string;
  amount: number;
};

export type DefinitionManifest = {
  game: string;
  generatedAt: string;
  definitionVersion: string;
  blockDefinitionCount: number;
  componentRecipeCount: number;
  note?: string;
};

export type DefinitionData = {
  manifest: DefinitionManifest;
  blockDefinitions: BlockDefinition[];
  componentRecipes: ComponentRecipe[];
};

export type CalculateResponse = {
  blueprint: {
    fileName: string;
    displayName?: string;
    gridName?: string;
    gridCount: number;
    blockCount: number;
  };
  blocks: CountRow[];
  components: CountRow[];
  ingots: CountRow[];
  ores: OreRequirementRow[];
  warnings: CalculationWarning[];
  definitionVersion: string;
  settings: {
    assemblerEfficiencyMultiplier: number;
  };
};

export type CountRow = {
  key: string;
  label: string;
  count: number;
};

export type OreYieldColumnKey =
  | "refineryYield4"
  | "refineryYield3"
  | "refineryYield2"
  | "refineryYield1"
  | "refineryYield0"
  | "basicRefinery";

export type OreRequirementRow = {
  key: string;
  label: string;
  ingotKey: string;
  ingotLabel: string;
  ingotCount: number;
  amounts: Record<OreYieldColumnKey, number | null>;
};

export type CalculationWarning = {
  kind:
    | "missing-block-definition"
    | "missing-component-recipe"
    | "schema-drift-detected"
    | "unsupported-file";
  severity: "info" | "warning" | "error";
  key?: string;
  message: string;
};

export type DefinitionsResponse = {
  manifest: DefinitionManifest;
};

export type CalculateErrorResponse = {
  error: string;
  warnings?: CalculationWarning[];
};
