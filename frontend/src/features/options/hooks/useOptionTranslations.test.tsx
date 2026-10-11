import { renderHook } from "@testing-library/react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import optionCatalog from "@/i18n/resources/en-US/optionCatalog.json";
import { useOptionTranslations } from "./useOptionTranslations";

describe("useOptionTranslations", () => {
  it("falls back per key when a locale has only partial catalog translations", async () => {
    const i18n = createInstance();
    await i18n.init({
      lng: "ru",
      fallbackLng: "en-US",
      resources: {
        "en-US": { optionCatalog },
        ru: {
          optionCatalog: {
            categories: { security: "Localized security" },
            sections: { vehicles: "Localized vehicles" },
            fields: {
              BackupsOnStart: { description: "Localized description" },
              ChatStreams: { choices: { radio: "Localized radio" } },
            },
            choiceSets: { enforcement: { ban: "Localized ban" } },
            specialValues: { disabled: "Localized disabled" },
          },
        },
      },
    });
    const { result } = renderHook(() => useOptionTranslations(), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    });

    expect(result.current.categoryLabel("security")).toBe("Localized security");
    expect(result.current.categoryLabel("maintenance")).toBe(
      optionCatalog.categories.maintenance,
    );
    expect(result.current.sectionLabel("vehicles")).toBe("Localized vehicles");
    expect(result.current.sectionLabel("antiCheat")).toBe(
      optionCatalog.sections.antiCheat,
    );
    expect(result.current.fieldDescription("BackupsOnStart")).toBe(
      "Localized description",
    );
    expect(result.current.fieldLabel("BackupsOnStart")).toBe(
      optionCatalog.fields.BackupsOnStart.label,
    );
    expect(result.current.fieldLabel("PublicName")).toBe(
      optionCatalog.fields.PublicName.label,
    );
    expect(result.current.fieldDescription("PublicName")).toBe(
      optionCatalog.fields.PublicName.description,
    );
    expect(result.current.choiceLabel("ChatStreams", "radio")).toBe(
      "Localized radio",
    );
    expect(result.current.choiceLabel("ChatStreams", "global")).toBe(
      optionCatalog.fields.ChatStreams.choices.global,
    );
    expect(
      result.current.choiceLabel("AntiCheatChecksum", "ban", "enforcement"),
    ).toBe("Localized ban");
    expect(
      result.current.choiceLabel("AntiCheatChecksum", "log", "enforcement"),
    ).toBe(optionCatalog.choiceSets.enforcement.log);
    expect(result.current.specialValueLabel("disabled")).toBe(
      "Localized disabled",
    );
    expect(result.current.specialValueLabel("unlimited")).toBe(
      optionCatalog.specialValues.unlimited,
    );
    expect(result.current.fieldLabel("Unknown")).toBe("Unknown");
    expect(result.current.fieldDescription("Unknown")).toBe("");
  });

  it("resolves shared enforcement choices", () => {
    const { result } = renderHook(() => useOptionTranslations());

    expect(
      result.current.choiceLabel("AntiCheatChecksum", "ban", "enforcement"),
    ).toBe(optionCatalog.choiceSets.enforcement.ban);
    expect(
      result.current.choiceLabel("BadWordPolicy", "log", "enforcement"),
    ).toBe(optionCatalog.choiceSets.enforcement.log);
  });

  it("keeps field-specific choices and unknown fallbacks", () => {
    const { result } = renderHook(() => useOptionTranslations());

    expect(result.current.choiceLabel("SteamScoreboard", "everyone")).toBe(
      optionCatalog.fields.SteamScoreboard.choices.everyone,
    );
    expect(result.current.choiceLabel("Unknown", "custom")).toBe("custom");
  });
});
