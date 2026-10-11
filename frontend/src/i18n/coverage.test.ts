import { expect, it } from "vitest";
import { preferredLanguageCoverage, translationCoverage } from "./coverage";

it("includes the Settings threshold and excludes languages below it", () => {
  const reference = { first: "One", second: "Two" };
  expect(translationCoverage(reference, { first: "Bir" })).toBe(
    preferredLanguageCoverage,
  );
  expect(translationCoverage(reference, {})).toBeLessThan(
    preferredLanguageCoverage,
  );
  expect(translationCoverage({}, {})).toBe(0);
});
