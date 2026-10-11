import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OptionCategory } from "../catalog";
import { useOptionsSearch } from "./useOptionsSearch";

const { locale, optionLabels } = vi.hoisted(() => ({
  locale: { current: "en-US" },
  optionLabels: {
    categoryLabel: (id: string) =>
      ({ general: "Bağlantı Alanı", lighting: "IŞIK AYARLARI" })[id] ?? id,
    choiceLabel: (_option: string, choice: string) => choice,
    fieldDescription: (name: string) =>
      ({ ServerPort: "Inbound endpoint for clients" })[name] ?? "",
    fieldLabel: (name: string) =>
      ({ ServerPort: "Listening socket" })[name] ?? name,
    sectionLabel: (id: string) =>
      ({ network: "Transport zone", switches: "Controls" })[id] ?? id,
    specialValueLabel: (meaning: string) => meaning,
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: locale.current },
  }),
}));

vi.mock("./useOptionTranslations", () => ({
  useOptionTranslations: () => optionLabels,
}));

const categories = [
  {
    id: "general",
    sections: [
      {
        id: "network",
        options: [
          { name: "ServerPort", type: "integer" },
          { name: "WelcomeText", type: "string" },
        ],
      },
    ],
  },
  {
    id: "lighting",
    sections: [
      {
        id: "switches",
        options: [{ name: "LightingToggle", type: "boolean" }],
      },
    ],
  },
] satisfies readonly OptionCategory[];

function optionNames(results: ReturnType<typeof useOptionsSearch>["results"]) {
  return results?.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.options.map((option) => option.name),
    ),
  );
}

beforeEach(() => {
  locale.current = "en-US";
});

describe("useOptionsSearch", () => {
  it("treats a blank query as inactive", () => {
    const { result } = renderHook(() => useOptionsSearch(categories));

    act(() => result.current.changeQuery("   "));

    expect(result.current.searching).toBe(false);
    expect(result.current.results).toBeNull();
  });

  it("finds options through translated hierarchy labels", async () => {
    const { result } = renderHook(() => useOptionsSearch(categories));

    act(() => result.current.changeQuery("  transport zone  "));

    await waitFor(() =>
      expect(optionNames(result.current.results)).toEqual([
        "ServerPort",
        "WelcomeText",
      ]),
    );
    expect(result.current.term).toBe("transport zone");
  });

  it("uses the active locale for matching", async () => {
    const { rerender, result } = renderHook(() => useOptionsSearch(categories));

    act(() => result.current.changeQuery("ışık"));
    await waitFor(() => expect(result.current.results).toEqual([]));

    locale.current = "tr-TR";
    rerender();

    await waitFor(() =>
      expect(optionNames(result.current.results)).toEqual(["LightingToggle"]),
    );
  });
});
