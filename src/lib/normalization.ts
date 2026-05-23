const objectBuilderPrefix = "MyObjectBuilder_";

export function normalizeTypeId(rawTypeId: string | undefined | null) {
  const value = cleanXmlValue(rawTypeId);
  const localValue = stripNamespace(value);

  return localValue.startsWith(objectBuilderPrefix)
    ? localValue.slice(objectBuilderPrefix.length)
    : localValue;
}

export function normalizeSubtypeId(rawSubtypeId: string | undefined | null) {
  return cleanXmlValue(rawSubtypeId);
}

export function makeDefinitionKey(typeId: string, subtypeId: string) {
  return `${normalizeTypeId(typeId)}/${normalizeSubtypeId(subtypeId)}`;
}

export function makeComponentKey(subtypeId: string) {
  return normalizeSubtypeId(subtypeId);
}

export function formatDefinitionLabel(typeId: string, subtypeId: string) {
  const normalizedType = normalizeTypeId(typeId);
  const normalizedSubtype = normalizeSubtypeId(subtypeId);

  return normalizedSubtype ? `${normalizedType} / ${normalizedSubtype}` : normalizedType;
}

export function stripNamespace(value: string) {
  const separatorIndex = value.indexOf(":");

  return separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value;
}

export function localName(name: string) {
  const withoutAttributePrefix = name.startsWith("@") ? name.slice(1) : name;

  return stripNamespace(withoutAttributePrefix);
}

function cleanXmlValue(rawValue: string | number | boolean | undefined | null) {
  if (rawValue === undefined || rawValue === null) {
    return "";
  }

  return String(rawValue).trim();
}
