import JSZip from "jszip";
import { maxSbcBytes, maxZipFileCount } from "@/lib/file-validation";

export async function extractBlueprintXmlFromZip(buffer: ArrayBuffer) {
  const archive = await JSZip.loadAsync(buffer);
  const files = Object.values(archive.files).filter((entry) => !entry.dir);

  if (files.length > maxZipFileCount) {
    throw new UploadError(413, "The zip file contains too many files.");
  }

  if (files.some((entry) => entry.name.toLowerCase().endsWith(".zip"))) {
    throw new UploadError(400, "Nested zip archives are not supported.");
  }

  const candidates = files
    .filter((entry) => entry.name.toLowerCase().replaceAll("\\", "/").endsWith("/bp.sbc") || entry.name.toLowerCase() === "bp.sbc")
    .sort((left, right) => left.name.length - right.name.length);

  if (candidates.length === 0) {
    throw new UploadError(400, "No bp.sbc file was found in the zip archive.");
  }

  for (const candidate of candidates) {
    const content = await candidate.async("uint8array");

    if (content.byteLength > maxSbcBytes) {
      throw new UploadError(413, "The bp.sbc file inside the zip archive is too large.");
    }

    const xml = new TextDecoder("utf-8", { fatal: false }).decode(content);

    if (xml.includes("<CubeBlocks") || xml.includes(":CubeBlocks")) {
      return xml;
    }
  }

  throw new UploadError(400, "The bp.sbc file found in the zip archive did not look like blueprint XML.");
}

export class UploadError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}
