import { describe, expect, it, vi } from "vitest";
import {
  createCatalogTranslationLoader,
  type CatalogTranslationModules,
  type CatalogTranslations,
} from "./catalogTranslations";

const english = {
  categories: {
    fallback: "English fallback",
    shared: "English shared",
  },
  names: { englishOnly: "English only" },
} satisfies CatalogTranslations;

const turkish = {
  categories: {
    fallback: "   ",
    shared: "Türkçe ortak",
  },
  names: { localizedOnly: "Yalnızca Türkçe" },
} satisfies CatalogTranslations;

function moduleKey(build: string, language: string) {
  return `${build}:${language}`;
}

describe("createCatalogTranslationLoader", () => {
  it("canonicalizes locales and falls back from blank or missing localized values", async () => {
    const loadEnglish = vi.fn(async () => ({ default: english }));
    const loadTurkish = vi.fn(async () => ({ default: turkish }));
    const modules = {
      "42:en-US": loadEnglish,
      "42:tr-TR": loadTurkish,
    } satisfies CatalogTranslationModules;
    const translations = createCatalogTranslationLoader<CatalogTranslations>({
      moduleKey,
      modules,
    });

    await translations.load("42", "tr-tr");

    expect(loadEnglish).toHaveBeenCalledOnce();
    expect(loadTurkish).toHaveBeenCalledOnce();
    expect(translations.get("42", "tr-tr", "categories", "shared")).toBe(
      "Türkçe ortak",
    );
    expect(translations.get("42", "tr-tr", "categories", "fallback")).toBe(
      "English fallback",
    );
    expect(translations.get("42", "tr-tr", "names", "englishOnly")).toBe(
      "English only",
    );
    expect(translations.get("42", "tr-tr", "names", "localizedOnly")).toBe(
      "Yalnızca Türkçe",
    );
    expect(translations.get("42", "tr-tr", "names", "missing")).toBeNull();
  });

  it("evicts a rejected request so a later load can retry", async () => {
    const loadEnglish = vi
      .fn<() => Promise<{ default: CatalogTranslations }>>()
      .mockRejectedValueOnce(new Error("translation unavailable"))
      .mockResolvedValueOnce({ default: english });
    const translations = createCatalogTranslationLoader<CatalogTranslations>({
      moduleKey,
      modules: { "42:en-US": loadEnglish },
    });

    await expect(translations.load("42", "en-US")).rejects.toThrow(
      "translation unavailable",
    );
    await expect(translations.load("42", "en-US")).resolves.toBeUndefined();

    expect(loadEnglish).toHaveBeenCalledTimes(2);
    expect(translations.get("42", "en-US", "categories", "shared")).toBe(
      "English shared",
    );
  });
});
