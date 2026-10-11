import { canonicalLanguage, defaultLanguage } from "@/i18n/locales";
import type { GameBuild } from "@/features/game/types";

export type CatalogTranslationResource<Translations> = {
  [Section in keyof Translations]: Record<string, string>;
};

export interface CatalogTranslations {
  categories: Record<string, string>;
  names: Record<string, string>;
}

export type CatalogTranslationModules<
  Translations extends CatalogTranslationResource<Translations> =
    CatalogTranslations,
> = Record<string, () => Promise<{ default: Translations }>>;

interface CatalogTranslationLoaderOptions<
  Translations extends CatalogTranslationResource<Translations>,
> {
  moduleKey: (build: GameBuild, language: string) => string;
  modules: CatalogTranslationModules<Translations>;
}

export function createCatalogTranslationLoader<
  Translations extends CatalogTranslationResource<Translations>,
>({ moduleKey, modules }: CatalogTranslationLoaderOptions<Translations>) {
  const resources = new Map<string, Translations>();
  const resourceRequests = new Map<string, Promise<void>>();

  function loadResource(build: GameBuild, language: string) {
    const key = `${build}:${language}`;
    if (resources.has(key)) return Promise.resolve();

    const loadModule = modules[moduleKey(build, language)];
    if (!loadModule) return Promise.resolve();

    const existingRequest = resourceRequests.get(key);
    if (existingRequest) return existingRequest;

    const request = loadModule()
      .then(({ default: resource }) => {
        resources.set(key, resource);
        return undefined;
      })
      .catch((error: unknown) => {
        resourceRequests.delete(key);
        throw error;
      });
    resourceRequests.set(key, request);
    return request;
  }

  async function load(build: GameBuild, language: string) {
    const languageTag = canonicalLanguage(language);
    await Promise.all([
      loadResource(build, defaultLanguage),
      languageTag === defaultLanguage
        ? Promise.resolve()
        : loadResource(build, languageTag),
    ]);
  }

  function get(
    build: GameBuild,
    language: string,
    section: keyof Translations,
    id: string,
  ) {
    const languageTag = canonicalLanguage(language);
    const localized = resources.get(`${build}:${languageTag}`)?.[section][id];
    if (localized?.trim()) return localized;

    const fallback = resources.get(`${build}:${defaultLanguage}`)?.[section][
      id
    ];
    return fallback?.trim() ? fallback : null;
  }

  return { get, load };
}
