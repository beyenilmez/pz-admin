import type { OptionDefinition } from "../catalog";
import { formatServerValue, type OptionFormValues } from "./optionValues";

export type OptionValidationIssue =
  | { type: "invalidChoice" }
  | { type: "integer" }
  | { type: "maximum"; value: number }
  | { type: "maximumLength"; value: number }
  | { type: "minimum"; value: number }
  | { type: "number" }
  | { type: "required" };

export function validateOptionValue(
  definition: OptionDefinition,
  values: OptionFormValues,
): OptionValidationIssue | undefined {
  if (definition.readOnly) return undefined;
  const value = values[definition.name];

  if (definition.required && (value === "" || value === undefined)) {
    return { type: "required" };
  }

  if (definition.choices) {
    const allowed = new Set(
      definition.choices.map((choice) => formatServerValue(choice.value)),
    );
    const selected = Array.isArray(value) ? value : [formatServerValue(value)];
    return selected.some((choice) => !allowed.has(choice))
      ? { type: "invalidChoice" }
      : undefined;
  }

  if (definition.type === "integer" || definition.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { type: "number" };
    }
    if (definition.type === "integer" && !Number.isInteger(value)) {
      return { type: "integer" };
    }
    if (definition.minimum !== undefined && value < definition.minimum) {
      return { type: "minimum", value: definition.minimum };
    }
    if (definition.maximum !== undefined && value > definition.maximum) {
      return { type: "maximum", value: definition.maximum };
    }
  } else if (
    typeof value === "string" &&
    definition.maximumLength !== undefined &&
    value.length > definition.maximumLength
  ) {
    return { type: "maximumLength", value: definition.maximumLength };
  }
  return undefined;
}

export function validateOptionValues(
  definitions: readonly OptionDefinition[],
  values: OptionFormValues,
) {
  const issues: Record<string, OptionValidationIssue> = {};

  for (const definition of definitions) {
    const issue = validateOptionValue(definition, values);
    if (issue) issues[definition.name] = issue;
  }

  return issues;
}
