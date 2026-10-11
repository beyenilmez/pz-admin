import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  OptionCategory,
  OptionDefinition,
  OptionSection,
} from "../catalog";
import { useOptionTranslations } from "./useOptionTranslations";

function normalizeSearchText(value: string, locale: string | undefined) {
  return locale ? value.toLocaleLowerCase(locale) : value.toLocaleLowerCase();
}

/** Keeps filtering behind the input so typing remains responsive. */
export function useOptionsSearch(categories: readonly OptionCategory[]) {
  const { i18n } = useTranslation("options");
  const labels = useOptionTranslations();
  const [query, setQuery] = useState("");
  const locale = i18n.resolvedLanguage;
  const deferredQuery = useDeferredValue(query.trim());

  const searchIndex = useMemo(() => {
    const entries = [];
    for (const category of categories) {
      const categoryLabel = labels.categoryLabel(category.id);
      for (const section of category.sections) {
        const sectionLabel = labels.sectionLabel(section.id);
        for (const definition of section.options) {
          entries.push({
            category,
            definition,
            section,
            text: normalizeSearchText(
              [
                definition.name,
                categoryLabel,
                sectionLabel,
                labels.fieldLabel(definition.name),
                labels.fieldDescription(definition.name),
              ].join(" "),
              locale,
            ),
          });
        }
      }
    }
    return entries;
  }, [categories, labels, locale]);

  const results = useMemo(() => {
    if (!deferredQuery) return null;

    const normalizedQuery = normalizeSearchText(deferredQuery, locale);
    const matches = new Map<
      OptionCategory,
      Map<OptionSection, OptionDefinition[]>
    >();

    for (const entry of searchIndex) {
      if (!entry.text.includes(normalizedQuery)) continue;

      let sections = matches.get(entry.category);
      if (!sections) {
        sections = new Map();
        matches.set(entry.category, sections);
      }

      const options = sections.get(entry.section);
      if (options) options.push(entry.definition);
      else sections.set(entry.section, [entry.definition]);
    }

    return Array.from(matches, ([category, sections]) => ({
      ...category,
      sections: Array.from(sections, ([section, options]) => ({
        ...section,
        options,
      })),
    }));
  }, [deferredQuery, locale, searchIndex]);

  const changeQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return {
    changeQuery,
    query,
    results: query.trim() ? results : null,
    searching: Boolean(query.trim()),
    term: deferredQuery,
  };
}
