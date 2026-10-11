import type { OptionDefinition, OptionValue } from "../catalog";

export type OptionFormValue = OptionValue | undefined;
export type OptionFormValues = Record<string, OptionFormValue>;

export function optionValuesEqual(
  value: OptionFormValue,
  expected: OptionFormValue,
): boolean {
  if (!Array.isArray(value) || !Array.isArray(expected)) {
    return value === expected;
  }

  const values = new Set(value);
  const expectedValues = new Set(expected);
  return (
    values.size === expectedValues.size &&
    [...values].every((entry) => expectedValues.has(entry))
  );
}

function parseServerValue(
  definition: OptionDefinition,
  rawValue: string,
): OptionFormValue {
  if (definition.multiple) {
    return rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (definition.type === "boolean") {
    if (rawValue === "true") return true;
    if (rawValue === "false") return false;
    throw new Error(`${definition.name} returned an invalid boolean value`);
  }

  if (definition.type === "integer" || definition.type === "number") {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`${definition.name} returned an invalid number`);
    }
    return value;
  }

  return rawValue;
}

export function formatServerValue(value: OptionFormValue): string {
  if (Array.isArray(value)) return value.join(",");
  if (value === undefined) return "";
  return String(value);
}

export function createFormValues(
  definitions: readonly OptionDefinition[],
  rawValues: Record<string, string | undefined>,
): OptionFormValues {
  const values: OptionFormValues = {};
  for (const definition of definitions) {
    const rawValue = rawValues[definition.name];
    if (rawValue !== undefined) {
      values[definition.name] = parseServerValue(definition, rawValue);
    } else if (definition.writeOnly) {
      // Preserve "untouched" separately from an explicitly entered empty
      // string, which allows a private server value to be cleared.
      values[definition.name] = undefined;
    }
  }
  return values;
}
