import { mkdir, rm, writeFile } from "node:fs/promises";
import { metadataLocale } from "#/scripts/metadata/locales.mjs";
import { generatePermissionStrings } from "./permissions.mjs";

export async function writeLocalizedResources(
  directory,
  translationsByLanguage,
) {
  // Recreate generated resources so removed translations cannot remain in the output.
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  for (const [language, translations] of translationsByLanguage) {
    const strings = generatePermissionStrings(translations);
    if (!strings) continue;
    const localeDirectory = `${directory}/${metadataLocale(language, "apple")}.lproj`;
    await mkdir(localeDirectory, { recursive: true });
    await writeFile(`${localeDirectory}/InfoPlist.strings`, strings);
  }
}
