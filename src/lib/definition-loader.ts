import blockDefinitions from "@/data/space-engineers/vanilla-block-components.json";
import componentRecipes from "@/data/space-engineers/vanilla-component-recipes.json";
import manifest from "@/data/space-engineers/definitions-manifest.json";
import type {
  BlockDefinition,
  ComponentRecipe,
  DefinitionData,
  DefinitionManifest,
} from "@/lib/types";

let cachedDefinitions: DefinitionData | null = null;

export function loadDefinitions(): DefinitionData {
  if (cachedDefinitions) {
    return cachedDefinitions;
  }

  cachedDefinitions = {
    manifest: manifest as DefinitionManifest,
    blockDefinitions: blockDefinitions as BlockDefinition[],
    componentRecipes: componentRecipes as ComponentRecipe[],
  };

  return cachedDefinitions;
}

export function getDefinitionManifest() {
  return loadDefinitions().manifest;
}
