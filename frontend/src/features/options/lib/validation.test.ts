import { describe, expect, it } from "vitest";
import type { OptionDefinition, OptionValue } from "../catalog";
import { validateOptionValues, type OptionValidationIssue } from "./validation";

describe("validateOptionValues", () => {
  it("reports the catalog constraints users can violate", () => {
    const definitions = [
      { name: "Required", required: true, type: "string" },
      { name: "Players", minimum: 1, maximum: 10, type: "integer" },
      { name: "Ratio", type: "number" },
      { name: "Name", maximumLength: 3, type: "string" },
      {
        choices: [{ id: "public", value: "public" }],
        name: "Mode",
        type: "string",
      },
      { name: "ReadOnly", readOnly: true, required: true, type: "string" },
    ] satisfies OptionDefinition[];
    const values: Record<string, OptionValue | undefined> = {
      Required: "",
      Players: 0,
      Ratio: Number.NaN,
      Name: "long",
      Mode: "private",
      ReadOnly: "",
    };

    expect(validateOptionValues(definitions, values)).toEqual({
      Required: { type: "required" },
      Players: { type: "minimum", value: 1 },
      Ratio: { type: "number" },
      Name: { type: "maximumLength", value: 3 },
      Mode: { type: "invalidChoice" },
    } satisfies Record<string, OptionValidationIssue>);
  });
});
