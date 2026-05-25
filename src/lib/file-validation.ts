export const acceptedBlueprintExtensions = [".sbc", ".zip"] as const;
export const maxSbcBytes = 12 * 1024 * 1024;
export const maxZipBytes = 24 * 1024 * 1024;
export const maxZipFileCount = 200;

export type UploadValidationResult =
  | { ok: true; sourceType: "sbc" | "zip" }
  | { ok: false; status: number; error: string };

export function validateBlueprintFile(file: File): UploadValidationResult {
  const extension = getFileExtension(file.name);

  if (extension !== ".sbc" && extension !== ".zip") {
    return {
      ok: false,
      status: 400,
      error: "Unsupported file. Load a bp.sbc file or a zipped blueprint folder.",
    };
  }

  const maxBytes = extension === ".zip" ? maxZipBytes : maxSbcBytes;

  if (file.size > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "The file is too large.",
    };
  }

  return {
    ok: true,
    sourceType: extension === ".zip" ? "zip" : "sbc",
  };
}

export function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
