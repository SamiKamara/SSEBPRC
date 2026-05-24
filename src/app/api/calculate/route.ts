import { NextResponse } from "next/server";
import { BlueprintParseError, parseBlueprint } from "@/lib/blueprint-parser";
import { calculateBlueprintResources } from "@/lib/calculator";
import { normalizeAssemblerEfficiencyMultiplier } from "@/lib/calculation-settings";
import { loadDefinitions } from "@/lib/definition-loader";
import { validateBlueprintFile } from "@/lib/file-validation";
import type { CalculateErrorResponse, UploadedBlueprint } from "@/lib/types";
import { extractBlueprintXmlFromZip, UploadError } from "@/lib/zip-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("blueprint");

    if (!(file instanceof File)) {
      return errorResponse(400, "Upload a bp.sbc file or a zipped blueprint folder.");
    }

    const validation = validateBlueprintFile(file);

    if (!validation.ok) {
      return errorResponse(validation.status, validation.error);
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
    const response = calculateBlueprintResources(blueprint, loadDefinitions(), {
      assemblerEfficiencyMultiplier: normalizeAssemblerEfficiencyMultiplier(
        formData.get("assemblerEfficiencyMultiplier"),
      ) ?? undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof UploadError) {
      return errorResponse(error.status, error.message);
    }

    if (error instanceof BlueprintParseError) {
      return errorResponse(400, error.message);
    }

    console.error(error);
    return errorResponse(500, "Calculation failed because of an unexpected server error.");
  }
}

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error } satisfies CalculateErrorResponse, { status });
}
