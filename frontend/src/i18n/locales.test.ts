import { describe, expect, it } from "vitest";
import { detectLanguage } from "@/i18n/locales";

describe("detectLanguage", () => {
  it.each([
    { preferred: ["tr-TR", "en-US"], expected: "tr-TR" },
    { preferred: ["tr", "en-US"], expected: "tr-TR" },
    { preferred: ["sw", "de-AT"], expected: "de" },
    { preferred: ["en-GB", "tr-TR"], expected: "tr-TR" },
    { preferred: ["en-GB"], expected: "en-US" },
    { preferred: ["es"], expected: "es-ES" },
    { preferred: ["es-MX"], expected: "es-MX" },
    { preferred: ["es-AR"], expected: "es-AR" },
    { preferred: ["es-AR", "de"], expected: "es-AR" },
    { preferred: ["es-CO"], expected: "en-US" },
    { preferred: ["es-CO", "de"], expected: "de" },
    { preferred: ["ar"], expected: "en-US" },
    { preferred: ["ar", "de"], expected: "de" },
    { preferred: ["pt"], expected: "pt-BR" },
    { preferred: ["pt-PT"], expected: "pt-PT" },
    { preferred: ["pt-AO"], expected: "en-US" },
    { preferred: ["zh-Hant"], expected: "zh-Hant" },
    { preferred: ["zh-TW"], expected: "zh-Hant" },
    { preferred: ["zh-HK"], expected: "zh-Hant" },
    { preferred: ["zh-Hans"], expected: "zh-Hans" },
    { preferred: ["zh-CN"], expected: "zh-Hans" },
    { preferred: ["zh-SG"], expected: "zh-Hans" },
    { preferred: ["zh-Hant-CN"], expected: "zh-Hant" },
    { preferred: ["zh-Hans-TW"], expected: "zh-Hans" },
    { preferred: ["invalid_locale", "tr"], expected: "tr-TR" },
    { preferred: ["sw"], expected: "en-US" },
    { preferred: [], expected: "en-US" },
  ])("matches $preferred to $expected", ({ preferred, expected }) => {
    expect(detectLanguage(preferred)).toBe(expected);
  });
});
