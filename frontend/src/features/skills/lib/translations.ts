import type { GameBuild } from "@/features/game/types";
import {
  createCatalogTranslationLoader,
  type CatalogTranslationModules,
  type CatalogTranslations,
} from "@/features/game/lib/catalogTranslations";

const translationModules = import.meta.glob<{ default: CatalogTranslations }>(
  "../../../data/skills/locales/*/*.json",
) satisfies CatalogTranslationModules;

const translations = createCatalogTranslationLoader<CatalogTranslations>({
  moduleKey: (build: GameBuild, language: string) =>
    `../../../data/skills/locales/${build}/${language}.json`,
  modules: translationModules,
});

export function loadSkillTranslations(build: GameBuild, language: string) {
  return translations.load(build, language);
}

function translatedName(
  build: GameBuild,
  language: string,
  section: keyof CatalogTranslations,
  id: string,
) {
  return translations.get(build, language, section, id);
}

export function translatedSkillCategoryName(
  build: GameBuild,
  language: string,
  categoryId: string,
) {
  return translatedName(build, language, "categories", categoryId);
}

export function translatedSkillName(
  build: GameBuild,
  language: string,
  skillId: string,
) {
  return translatedName(build, language, "names", skillId);
}
