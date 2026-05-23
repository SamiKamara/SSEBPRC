import { NextResponse } from "next/server";
import { getDefinitionManifest } from "@/lib/definition-loader";
import type { DefinitionsResponse } from "@/lib/types";

export function GET() {
  return NextResponse.json({
    manifest: getDefinitionManifest(),
  } satisfies DefinitionsResponse);
}
