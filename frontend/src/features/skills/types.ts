import type { GameBuild } from "@/features/game/types";

export interface RawSkillCatalogCategory {
  id: string;
  skills: RawSkillCatalogEntry[];
  translationId: string;
}

export interface RawSkillCatalogData {
  build: string;
  categories: RawSkillCatalogCategory[];
  progressions: Record<string, number[]>;
}

export interface RawSkillCatalogEntry {
  id: string;
  image: string;
  progression: string;
  translationId?: string;
}

export interface SkillCatalog {
  build: GameBuild;
  categories: SkillCatalogCategory[];
  language: string;
  progressions: ReadonlyMap<string, SkillProgression>;
  skills: SkillCatalogEntry[];
  skillsById: ReadonlyMap<string, SkillCatalogEntry>;
}

export interface SkillCatalogCategory {
  id: string;
  name: string;
  skills: SkillCatalogEntry[];
}

export interface SkillCatalogEntry {
  id: string;
  image: string;
  name: string;
  progressionId: string;
}

export interface SkillProgression {
  id: string;
  levels: SkillProgressionLevel[];
  maximumXp: number;
}

export interface SkillProgressionLevel {
  level: number;
  totalXp: number;
  xp: number;
}
