import { readFile } from "node:fs/promises";
import path from "node:path";
import { defaultLanguage, locales } from "../../src/i18n/locales.ts";
import { frontendRoot } from "./paths.mjs";

export { defaultLanguage };

export async function readMetadataTranslations() {
  // Emit the default language before translations.
  const languages = [
    defaultLanguage,
    ...locales
      .map(({ code }) => code)
      .filter((code) => code !== defaultLanguage),
  ];
  const entries = await Promise.all(
    languages.map(async (language) => {
      const filename = path.join(
        frontendRoot,
        "src/i18n/resources",
        language,
        "metadata.json",
      );
      try {
        return [language, JSON.parse(await readFile(filename, "utf8"))];
      } catch (error) {
        if (error.code !== "ENOENT" || language === defaultLanguage)
          throw error;
        return null;
      }
    }),
  );
  return new Map(entries.filter((entry) => entry !== null));
}

export function screenshotText(screenshotId, translationsByLanguage) {
  // Capture IDs use kebab-case; translation keys use lowerCamelCase.
  const translationKey = screenshotId.replace(/-([a-z])/g, (_, letter) =>
    letter.toUpperCase(),
  );
  const captions = {};
  const alt = {};
  for (const [language, translations] of translationsByLanguage) {
    const text = translations.screenshots?.[translationKey];
    if (text?.caption) captions[language] = text.caption;
    if (text?.alt) alt[language] = text.alt;
  }
  for (const [field, texts] of Object.entries({ caption: captions, alt })) {
    if (
      typeof texts[defaultLanguage] !== "string" ||
      !texts[defaultLanguage].trim()
    ) {
      throw new Error(
        `Missing ${defaultLanguage} ${field} text for ${screenshotId}`,
      );
    }
  }
  return { captions, alt };
}
