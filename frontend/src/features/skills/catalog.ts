import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import {
  loadSkillTranslations,
  translatedSkillCategoryName,
  translatedSkillName,
} from "./lib/translations";
import type {
  RawSkillCatalogData,
  SkillCatalog,
  SkillCatalogCategory,
  SkillCatalogEntry,
  SkillProgression,
} from "./types";

const catalogLoaders = {
  "41": () => import("@/data/skills/41.json"),
  "42": () => import("@/data/skills/42.json"),
} satisfies Record<GameBuild, () => Promise<{ default: RawSkillCatalogData }>>;

const catalogRequests = new Map<string, Promise<SkillCatalog>>();

function prepareProgression(id: string, levelXp: number[]): SkillProgression {
  let totalXp = 0;
  const levels = levelXp.map((xp, index) => {
    totalXp += xp;
    return { level: index + 1, totalXp, xp };
  });
  return { id, levels, maximumXp: totalXp };
}

function prepareCatalog(
  data: RawSkillCatalogData,
  build: GameBuild,
  language: string,
): SkillCatalog {
  const progressions = new Map(
    Object.entries(data.progressions).map(([id, levelXp]) => [
      id,
      prepareProgression(id, levelXp),
    ]),
  );
  const categories: SkillCatalogCategory[] = [];
  const skills: SkillCatalogEntry[] = [];
  const skillsById = new Map<string, SkillCatalogEntry>();

  for (const rawCategory of data.categories) {
    const categorySkills = rawCategory.skills.map((rawSkill) => {
      if (!progressions.has(rawSkill.progression)) {
        throw new Error(
          `Unknown progression ${rawSkill.progression} for skill ${rawSkill.id}`,
        );
      }

      const skill: SkillCatalogEntry = {
        id: rawSkill.id,
        image: rawSkill.image,
        name:
          translatedSkillName(build, language, rawSkill.id) ??
          rawSkill.translationId ??
          rawSkill.id,
        progressionId: rawSkill.progression,
      };
      skills.push(skill);
      skillsById.set(skill.id, skill);
      return skill;
    });

    categories.push({
      id: rawCategory.id,
      name:
        translatedSkillCategoryName(build, language, rawCategory.id) ??
        rawCategory.translationId,
      skills: categorySkills,
    });
  }

  return {
    build,
    categories,
    language,
    progressions,
    skills,
    skillsById,
  };
}

export function loadSkillCatalog(
  build: GameBuild,
  language: string,
): Promise<SkillCatalog> {
  const languageTag = canonicalLanguage(language);
  const requestKey = `${build}:${languageTag}`;
  const existingRequest = catalogRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = Promise.all([
    catalogLoaders[build](),
    loadSkillTranslations(build, languageTag),
  ]).then(([{ default: data }]) => {
    if (data.build !== build) {
      throw new Error(
        `Expected Build ${build} skill data, received ${data.build}`,
      );
    }
    return prepareCatalog(data, build, languageTag);
  });
  catalogRequests.set(requestKey, request);
  void request.catch(() => {
    if (catalogRequests.get(requestKey) === request) {
      catalogRequests.delete(requestKey);
    }
  });
  return request;
}
