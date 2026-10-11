import { describe, expect, it } from "vitest";
import type {
  ConsoleCompletionSource,
  ConsoleCompletionValues,
} from "../types";
import { consoleCompletionSource, consoleSuggestions } from "./catalog";

const completionValues = {
  accessLevels: ["admin"],
  booleanFlags: ["-true", "-false"],
  commands: ["save"],
  items: ["Base.Axe", "Base.Hammer"],
  onlinePlayers: ["Alice", "Alice Smith"],
  optionNames: ["AdminSafehouse"],
  optionValues: ["ignored-dynamic-value"],
  players: ["Alice", "Bob"],
  skills: ["Aiming="],
  vehicles: ["Base.CarNormal"],
} satisfies ConsoleCompletionValues;

describe("consoleCompletionSource", () => {
  it.each([
    { expected: "onlinePlayers", input: "additem " },
    { expected: "items", input: "additem Alice " },
    { expected: "players", input: "banuser " },
    { expected: "skills", input: "addxp Alice " },
    { expected: "vehicles", input: "addvehicle " },
  ] satisfies readonly {
    expected: ConsoleCompletionSource;
    input: string;
  }[])("selects $expected completions for $input", ({ expected, input }) => {
    expect(consoleCompletionSource("42", input)).toBe(expected);
  });

  it("treats an escaped space as part of one argument", () => {
    expect(consoleCompletionSource("42", "additem Alice\\ Smith ")).toBe(
      "items",
    );
  });

  it.each([
    { label: "the command position", input: "add" },
    { label: "a quoted command", input: '"additem" ' },
    { label: "an unknown command", input: "unknown " },
    { label: "an unsupported argument", input: "additem Alice Base.Axe " },
  ])("has no argument source at $label", ({ input }) => {
    expect(consoleCompletionSource("42", input)).toBeNull();
  });
});

describe("consoleSuggestions", () => {
  it("uses the command catalog at command position and dynamic values for arguments", () => {
    expect(
      consoleSuggestions("42", "addv", completionValues).matches,
    ).toContain("addvehicle");
    expect(
      consoleSuggestions("42", "addvehicle Ba", completionValues).matches,
    ).toEqual(["Base.CarNormal"]);
  });

  it("reports quoted-token replacement bounds without replacing its contents only", () => {
    const input = 'additem "Ali"';
    const suggestions = consoleSuggestions("42", input, completionValues);

    expect(suggestions).toMatchObject({
      anchorPosition: input.indexOf("Ali"),
      matches: ["Alice", "Alice Smith"],
      query: "Ali",
      quote: '"',
      replacementEnd: input.length,
      replacementStart: input.indexOf('"'),
    });
  });

  it("replaces the whole active token when the caret is in its middle", () => {
    const input = "additem AlZZ tail";
    const replacementStart = input.indexOf("AlZZ");
    const suggestions = consoleSuggestions(
      "42",
      input,
      completionValues,
      replacementStart + 2,
    );

    expect(suggestions).toMatchObject({
      anchorPosition: replacementStart,
      matches: ["Alice", "Alice Smith"],
      query: "Al",
      quote: null,
      replacementEnd: replacementStart + "AlZZ".length,
      replacementStart,
    });
  });

  it.each([
    {
      expected: ["true", "false"],
      option: "AdminSafehouse",
      type: "boolean",
    },
    {
      expected: ["1", "2", "3", "4"],
      option: "MapRemotePlayerVisibility",
      type: "choice",
    },
    { expected: ["0"], option: "BackupsPeriod", type: "special" },
  ])(
    "derives $type option values from the option catalog",
    ({ expected, option }) => {
      expect(
        consoleSuggestions("42", `changeoption ${option} `, completionValues)
          .matches,
      ).toEqual(expected);
    },
  );

  it("withholds build commands without a build and ignores unsupported contexts", () => {
    expect(
      consoleSuggestions(undefined, "add", completionValues).matches,
    ).toEqual([]);
    expect(
      consoleSuggestions("42", "unknown value", completionValues).matches,
    ).toEqual([]);
    expect(
      consoleSuggestions("42", "additem Alice Base.Axe extra", completionValues)
        .matches,
    ).toEqual([]);
  });
});
