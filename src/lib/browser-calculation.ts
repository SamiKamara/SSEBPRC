import { parseBlueprint } from "@/lib/blueprint-parser";
import { calculateBlueprintResources } from "@/lib/calculator";
import type { CalculationSettings } from "@/lib/calculation-settings";
import { loadDefinitions } from "@/lib/definition-loader";
import { validateBlueprintFile } from "@/lib/file-validation";
import type { CalculateResponse, UploadedBlueprint } from "@/lib/types";
import { extractBlueprintXmlFromZip } from "@/lib/zip-reader";

type BrowserCalculationOptions = Pick<CalculationSettings, "assemblerEfficiencyMultiplier">;

export async function calculateBlueprintInBrowser(
  file: File,
  options: BrowserCalculationOptions,
): Promise<CalculateResponse> {
  const validation = validateBlueprintFile(file);

  if (!validation.ok) {
    throw new BrowserCalculationError(validation.error);
  }

  const buffer = await file.arrayBuffer();
  const xml =
    validation.sourceType === "zip"
      ? await extractBlueprintXmlFromZip(buffer)
      : new TextDecoder("utf-8", { fatal: false }).decode(buffer);

  const uploadedBlueprint: UploadedBlueprint = {
    fileName: file.name,
    sourceType: validation.sourceType,
    xml,
  };

  const blueprint = parseBlueprint(uploadedBlueprint);

  return calculateBlueprintResources(blueprint, loadDefinitions(), {
    assemblerEfficiencyMultiplier: options.assemblerEfficiencyMultiplier,
  });
}

class BrowserCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserCalculationError";
  }
}
