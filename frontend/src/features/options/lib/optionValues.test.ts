import { describe, expect, it } from "vitest";
import type { OptionDefinition } from "../catalog";
import { createFormValues, type OptionFormValues } from "./optionValues";

describe("createFormValues", () => {
  it("converts server strings into values the option form can edit", () => {
    const definitions = [
      { name: "Enabled", type: "boolean" },
      { name: "Count", type: "integer" },
      { name: "Ratio", type: "number" },
      { name: "Message", type: "text" },
      { multiple: true, name: "Modes", type: "string" },
      { name: "Secret", type: "string", writeOnly: true },
    ] satisfies OptionDefinition[];

    expect(
      createFormValues(definitions, {
        Count: "42",
        Enabled: "true",
        Message: "  preserved text  ",
        Modes: "alpha, beta, ,gamma",
        Ratio: "1.25",
      }),
    ).toEqual({
      Count: 42,
      Enabled: true,
      Message: "  preserved text  ",
      Modes: ["alpha", "beta", "gamma"],
      Ratio: 1.25,
      Secret: undefined,
    } satisfies OptionFormValues);
  });

  it("rejects malformed numeric values returned by the boundary", () => {
    expect(() =>
      createFormValues([{ name: "Count", type: "integer" }], {
        Count: "not-a-number",
      }),
    ).toThrow("Count returned an invalid number");
  });
});
