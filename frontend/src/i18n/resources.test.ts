import { afterEach, describe, expect, it } from "vitest";
import {
  defaultResources,
  interfaceTranslationCoverage,
  resources,
} from "./resources";

const testLanguage = "coverage-test";

function stringCount(value: unknown): number {
  if (typeof value === "string") return 1;
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce<number>(
    (total, child) => total + stringCount(child),
    0,
  );
}

afterEach(() => {
  delete resources[testLanguage];
});

describe("interface translation coverage", () => {
  it("returns zero for a language without translations", () => {
    expect(interfaceTranslationCoverage(testLanguage)).toBe(0);
  });

  it("returns full coverage for complete translations", () => {
    resources[testLanguage] = { ...defaultResources };
    expect(interfaceTranslationCoverage(testLanguage)).toBe(100);
  });

  it("calculates the percentage of English strings with translations", () => {
    const totalStrings = stringCount(defaultResources);

    for (const namespace of ["optionCatalog", "settings"] as const) {
      resources[testLanguage] = { ...defaultResources };
      delete resources[testLanguage][namespace];
      const missingStrings = stringCount(defaultResources[namespace]);
      const expected = Math.round((1 - missingStrings / totalStrings) * 100);
      expect(interfaceTranslationCoverage(testLanguage)).toBe(expected);
    }
  });
});
