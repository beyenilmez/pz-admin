import { translationCoverage } from "./coverage";
import common from "./resources/en-US/common.json";
import console from "./resources/en-US/console.json";
import items from "./resources/en-US/items.json";
import messages from "./resources/en-US/messages.json";
import optionCatalog from "./resources/en-US/optionCatalog.json";
import options from "./resources/en-US/options.json";
import players from "./resources/en-US/players.json";
import servers from "./resources/en-US/servers.json";
import serverActions from "./resources/en-US/serverActions.json";
import session from "./resources/en-US/session.json";
import settings from "./resources/en-US/settings.json";
import skills from "./resources/en-US/skills.json";
import tools from "./resources/en-US/tools.json";
import vehicleCatalog from "./resources/en-US/vehicleCatalog.json";
import vehicles from "./resources/en-US/vehicles.json";
import type { Resource, ResourceKey } from "i18next";
import { defaultLanguage } from "./locales";
import namespaceManifest from "./namespaces.json";

export type ResourceNamespace = keyof typeof namespaceManifest;

export const defaultResources = {
  common,
  console,
  items,
  messages,
  optionCatalog,
  options,
  players,
  servers,
  serverActions,
  session,
  settings,
  skills,
  tools,
  vehicleCatalog,
  vehicles,
} as const satisfies Record<ResourceNamespace, ResourceKey>;

const translationFiles = import.meta.glob<{ default: ResourceKey }>(
  "./resources/*/*.json",
  { eager: true },
);

export const resources = Object.entries(translationFiles).reduce<Resource>(
  (languages, [path, module]) => {
    const match = path.match(/^\.\/resources\/([^/]+)\/([^/]+)\.json$/);
    if (!match) return languages;

    const [, language, namespace] = match;
    const languageResources = languages[language] ?? {};
    languageResources[namespace] = module.default;
    languages[language] = languageResources;
    return languages;
  },
  {},
);

// The default language is explicit so keys stay type-checked. Other locale
// directories and their namespaces are registered automatically.
resources[defaultLanguage] = defaultResources;

export function interfaceTranslationCoverage(language: string) {
  return translationCoverage(defaultResources, resources[language]);
}
