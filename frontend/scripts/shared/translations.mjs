import { readFile } from "node:fs/promises";
import path from "node:path";
import { frontendRoot } from "./paths.mjs";
import { defaultLanguage, locales } from "../../src/i18n/locales.ts";
import { translationCoverage } from "../../src/i18n/coverage.ts";
import namespaces from "../../src/i18n/namespaces.json" with { type: "json" };

async function readTranslations(language) {
  const entries = await Promise.all(
    Object.keys(namespaces).map(async (namespace) => {
      const file = path.join(
        frontendRoot,
        "src/i18n/resources",
        language,
        `${namespace}.json`,
      );
      try {
        return [namespace, JSON.parse(await readFile(file, "utf8"))];
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        return [namespace, {}];
      }
    }),
  );
  return Object.fromEntries(entries);
}

export async function languageCoverage() {
  const reference = await readTranslations(defaultLanguage);
  return Promise.all(
    locales.map(async ({ code }) => ({
      code,
      percentage: translationCoverage(reference, await readTranslations(code)),
    })),
  );
}
