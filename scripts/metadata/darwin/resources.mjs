import { mkdir, rm, writeFile } from "node:fs/promises";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";
import { defaultLanguage } from "#/frontend/src/i18n/locales.ts";
import { generateInfoPlistStrings } from "./strings.mjs";

export async function writeLocalizedResources(
  directory,
  translationsByLanguage,
) {
  // Recreate generated resources so removed translations cannot remain in the output.
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  const sourceTranslations = translationsByLanguage.get(defaultLanguage);
  for (const [language, translations] of translationsByLanguage) {
    const strings = generateInfoPlistStrings(translations, sourceTranslations);
    const localeDirectory = `${directory}/${metadataLocale(language, "apple")}.lproj`;
    await mkdir(localeDirectory, { recursive: true });
    await writeFile(`${localeDirectory}/InfoPlist.strings`, strings);
  }
}
