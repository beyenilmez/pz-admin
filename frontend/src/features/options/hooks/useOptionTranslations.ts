import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** Provides names for the dynamic IDs stored in the option catalog. */
export function useOptionTranslations() {
  const { t } = useTranslation("optionCatalog");

  return useMemo(() => {
    // Resolve dynamic catalog keys individually so English fallback applies per key.
    const text = (key: string, fallback: string) =>
      t(key, { defaultValue: fallback });

    return {
      categoryLabel: (id: string) => text(`categories.${id}`, id),
      choiceLabel: (
        option: string,
        choice: string,
        translationGroup?: string,
      ) =>
        translationGroup
          ? text(`choiceSets.${translationGroup}.${choice}`, choice)
          : text(`fields.${option}.choices.${choice}`, choice),
      fieldDescription: (name: string) =>
        text(`fields.${name}.description`, ""),
      fieldLabel: (name: string) => text(`fields.${name}.label`, name),
      sectionLabel: (id: string) => text(`sections.${id}`, id),
      specialValueLabel: (meaning: string) =>
        text(`specialValues.${meaning}`, meaning),
    };
  }, [t]);
}
