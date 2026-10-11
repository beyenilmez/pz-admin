import { expect, it } from "vitest";
import { combineFrontendNotices } from "./report";

it("fills missing main texts without changing package versions or inputs", () => {
  const dependency = { name: "package", version: "2", text: " " };
  const addition = {
    name: "package",
    version: "1",
    text: "License",
    source: "upstream",
  };
  expect(combineFrontendNotices([dependency], [addition])).toEqual([
    { ...dependency, text: "License", source: "upstream" },
  ]);
  expect(dependency.text).toBe(" ");
});

it("preserves collected license texts", () => {
  const dependency = { name: "package", text: "Collected license" };
  expect(
    combineFrontendNotices(
      [dependency],
      [{ name: "package", text: "Fallback license" }],
    ),
  ).toEqual([dependency]);
});

it("keeps unmatched notices as separate flat entries", () => {
  const dependency = { name: "package", text: "Collected license" };
  const additions = [
    { name: "embedded", text: "Embedded license" },
    { name: "Package", text: "Unmatched license" },
  ];
  expect(combineFrontendNotices([dependency], additions)).toEqual([
    dependency,
    ...additions,
  ]);
});
