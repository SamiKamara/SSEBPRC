export type CalculationSettings = {
  assemblerEfficiencyMultiplier: number;
};

export const defaultAssemblerEfficiencyMultiplier = 3;
export const minAssemblerEfficiencyMultiplier = 0.01;
export const maxAssemblerEfficiencyMultiplier = 100;

export const defaultCalculationSettings: CalculationSettings = {
  assemblerEfficiencyMultiplier: defaultAssemblerEfficiencyMultiplier,
};

export function normalizeCalculationSettings(
  settings?: Partial<CalculationSettings>,
): CalculationSettings {
  return {
    assemblerEfficiencyMultiplier:
      normalizeAssemblerEfficiencyMultiplier(settings?.assemblerEfficiencyMultiplier) ??
      defaultAssemblerEfficiencyMultiplier,
  };
}

export function normalizeAssemblerEfficiencyMultiplier(value: unknown) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return roundMultiplier(
    Math.min(
      maxAssemblerEfficiencyMultiplier,
      Math.max(minAssemblerEfficiencyMultiplier, numericValue),
    ),
  );
}

function roundMultiplier(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
