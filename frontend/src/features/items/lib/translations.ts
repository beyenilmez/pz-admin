import type { GameBuild } from "@/features/game/types";
import {
  createCatalogTranslationLoader,
  type CatalogTranslationModules,
  type CatalogTranslations,
} from "@/features/game/lib/catalogTranslations";

const translationModules = import.meta.glob<{ default: CatalogTranslations }>(
  "../../../data/items/locales/*/*.json",
) satisfies CatalogTranslationModules;

const translations = createCatalogTranslationLoader<CatalogTranslations>({
  moduleKey: (build: GameBuild, language: string) =>
    `../../../data/items/locales/${build}/${language}.json`,
  modules: translationModules,
});

export function loadItemTranslations(build: GameBuild, language: string) {
  return translations.load(build, language);
}

export function translatedItemName(
  build: GameBuild,
  language: string,
  itemId: string,
) {
  return translatedName(build, language, "names", itemId);
}

export function translatedItemCategoryName(
  build: GameBuild,
  language: string,
  categoryId: string,
) {
  return translatedName(build, language, "categories", categoryId);
}

function translatedName(
  build: GameBuild,
  language: string,
  section: keyof CatalogTranslations,
  id: string,
) {
  return translations.get(build, language, section, id);
}
