import { makeComponentKey, makeDefinitionKey } from "@/lib/normalization";

const blockAliases = new Map<string, string>([
  [makeDefinitionKey("LargeBlockArmorBlock", ""), makeDefinitionKey("CubeBlock", "LargeBlockArmorBlock")],
  [makeDefinitionKey("SmallBlockArmorBlock", ""), makeDefinitionKey("CubeBlock", "SmallBlockArmorBlock")],
  [makeDefinitionKey("MyObjectBuilder_CubeBlock", "LargeHeavyBlockArmorBlock"), makeDefinitionKey("CubeBlock", "LargeHeavyBlockArmorBlock")],
]);

const componentAliases = new Map<string, string>([
  [makeComponentKey("ComputerComponent"), makeComponentKey("Computer")],
  [makeComponentKey("SteelPlateComponent"), makeComponentKey("SteelPlate")],
]);

export function resolveBlockAlias(key: string) {
  return blockAliases.get(key);
}

export function resolveComponentAlias(key: string) {
  return componentAliases.get(key);
}
